import { db } from '../database';

// Keys to backup/restore from LocalStorage
const STORAGE_KEYS = [
  'wealth-aggregator-xp',
  'theme',
  'realized_ltcg_fy',
  'wealth-aggregator-logic',
  'wealth-aggregator-paper-trader'
];

/**
 * Generates and downloads a JSON snapshot of the DB and LocalStorage.
 */
export const handleDownloadBackup = async () => {
  try {
    const allData: any = {
      meta: {
        version: 5,
        timestamp: new Date().toISOString(),
        app: "WealthAggregator"
      },
      data: {},
      storage: {}
    };

    // 1. Snapshot IndexedDB
    // @ts-ignore - Accessing Dexie internals to iterate all tables dynamically
    for (const table of db.tables) {
      const rows = await table.toArray();
      allData.data[table.name] = rows;
    }

    // 2. Snapshot LocalStorage
    STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) allData.storage[key] = val;
    });

    // 3. Trigger Download
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WealthBackup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Backup Export Failed:", err);
    throw new Error("Failed to generate backup file.");
  }
};

/**
 * Nuclear Restore:
 * 1. Atomically wipes DB.
 * 2. Sanitizes and Inserts new data.
 * 3. Restores LocalStorage.
 */
export const restoreFromJSON = async (jsonData: any): Promise<void> => {
  if (!jsonData || !jsonData.data) {
    throw new Error("Invalid backup file format: Missing 'data' object.");
  }

  // Transaction guarantees all-or-nothing execution
  // @ts-ignore
  await db.transaction('rw', db.tables, async () => {
    // 1. WIPE EVERYTHING
    // @ts-ignore
    await Promise.all(db.tables.map(table => table.clear()));

    // 2. RESTORE TABLES
    const tables = Object.keys(jsonData.data);
    for (const tableName of tables) {
      const rows = jsonData.data[tableName];
      // @ts-ignore
      const table = db.table(tableName);

      if (!table || !Array.isArray(rows) || rows.length === 0) continue;

      // 3. SANITIZE ROWS
      // We strip IDs from auto-increment tables to prevent KeyConstraints
      const sanitizedRows = rows.map((row: any) => {
        // Tables that rely on specific IDs (UUIDs or Date Strings) must keep them
        if (['investments', 'history', 'daily_reviews'].includes(tableName)) {
          return row;
        }
        
        // For 'trades', 'dividends', etc., let Dexie generate fresh IDs
        const { id, ...rest } = row;
        return rest;
      });

      await table.bulkAdd(sanitizedRows);
    }
  });

  // 4. RESTORE LOCALSTORAGE
  if (jsonData.storage) {
    Object.entries(jsonData.storage).forEach(([key, val]) => {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    });
  }
};