import { db } from '../database';
import { logger } from "./Logger";

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

    try {
      // Modern API: Force "Save As" Dialog
      // @ts-ignore - File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: `WealthBackup_${new Date().toISOString().split('T')[0]}.json`,
        types: [{
          description: 'Wealth Aggregator Backup',
          accept: { 'application/json': ['.json'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

    } catch (fsError: any) {
      if (fsError.name === 'AbortError') return; // User cancelled

      logger.warn("FileSystem API failed/unsupported, falling back to legacy download:", fsError);

      // Fallback: Data URI (Legacy)
      const dataUri = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      const link = document.createElement('a');
      link.href = dataUri;
      link.setAttribute('download', `WealthBackup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    }

  } catch (err) {
    logger.error("Backup Export Failed:", err);
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
  logger.info("[BACKUP SERVICE] Starting restore...", jsonData);

  if (!jsonData || !jsonData.data) {
    throw new Error("Invalid backup file format: Missing 'data' object.");
  }

  // Transaction guarantees all-or-nothing execution
  // @ts-ignore
  await db.transaction('rw', db.tables, async () => {
    // 1. WIPE EVERYTHING
    logger.info("[BACKUP SERVICE] Clearing all tables...");
    // @ts-ignore
    await Promise.all(db.tables.map(table => table.clear()));

    // 2. RESTORE TABLES using bulkPut (handles existing IDs)
    const tables = Object.keys(jsonData.data);
    for (const tableName of tables) {
      const rows = jsonData.data[tableName];
      // @ts-ignore
      const table = db.table(tableName);

      if (!table || !Array.isArray(rows) || rows.length === 0) continue;

      logger.info(`[BACKUP SERVICE] Restoring ${rows.length} rows to ${tableName}`);
      await table.bulkPut(rows); // Use bulkPut instead of bulkAdd
    }
  });

  logger.info("[BACKUP SERVICE] Database restore complete.");

  // 3. RESTORE LOCALSTORAGE
  if (jsonData.storage) {
    Object.entries(jsonData.storage).forEach(([key, val]) => {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    });
    logger.info("[BACKUP SERVICE] LocalStorage restored.");
  }
};