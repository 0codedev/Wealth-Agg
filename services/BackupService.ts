
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
 * Generates a full JSON dump of IndexedDB and specific LocalStorage keys.
 */
export const handleDownloadBackup = async () => {
  try {
    const allData: any = {
      meta: {
        version: 3, 
        timestamp: new Date().toISOString(),
        app: "WealthAggregator"
      },
      data: {},
      storage: {}
    };

    // 1. Snapshot IndexedDB
    // Type assertion to 'any' to access internal 'tables' property
    const tables = (db as any).tables;
    for (const table of tables) {
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
    console.error("Backup Generation Failed:", err);
    throw new Error("Failed to generate backup file.");
  }
};

/**
 * THE NUCLEAR OPTION:
 * 1. Locks the Database in a single Transaction.
 * 2. Wipes ALL tables (Table.clear()).
 * 3. Strips 'id' from EVERY row.
 * 4. Regenerates UUIDs for manual-key tables (investments).
 * 5. Bulk Adds clean data.
 * 
 * @param jsonData Parsed JSON object from the backup file
 */
export const restoreBackupData = async (jsonData: any) => {
  if (!jsonData || !jsonData.data || !jsonData.meta) {
    throw new Error("Invalid Backup File: Missing data or metadata.");
  }

  // --- ATOMIC TRANSACTION START ---
  // We lock all tables for Read/Write to ensure a clean wipe and restore.
  await (db as any).transaction('rw', (db as any).tables, async () => {
    console.log("NUCLEAR RESTORE: Atomic Transaction Started.");
    const tables = (db as any).tables;

    // STEP 1: WIPE EVERYTHING
    // Iterate over actual DB tables to ensure we catch everything defined in schema
    for (const table of tables) {
      console.log(`Clearing table: ${table.name}`);
      await table.clear();
    }

    // STEP 2: RESTORE & SANITIZE
    for (const tableName of Object.keys(jsonData.data)) {
      const rows = jsonData.data[tableName];
      const table = (db as any).table(tableName);

      if (!table) {
        console.warn(`Skipping unknown table in backup: ${tableName}`);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // STEP 3: RE-KEYING LOGIC
      // We strip the old 'id' to prevent KeyConstraintErrors.
      const sanitizedRows = rows.map((row: any) => {
        // Destructure to separate 'id' from the rest of the data
        const { id, ...rest } = row;

        // Special Case: 'investments' table uses a string UUID as Primary Key (not auto-inc).
        // Since we stripped the old ID, we MUST generate a new one to allow insertion.
        if (tableName === 'investments') {
            return {
                ...rest,
                id: crypto.randomUUID() // Fresh UUID
            };
        }

        // Special Case: Tables with date-based keys (history, daily_reviews)
        // These don't rely on 'id' but on 'date'. We keep the rest of the object.
        // If they accidentally had an 'id' property, it is now stripped.
        
        // Standard Case: Auto-Increment tables (trades, life_events, etc.)
        // By returning 'rest' without an ID, Dexie will automatically generate
        // the next available integer key (e.g., 1, 2, 3...).
        return rest;
      });

      // STEP 4: BULK INSERT
      // We use bulkAdd because we are inserting "new" records (new IDs)
      await table.bulkAdd(sanitizedRows);
      console.log(`Restored ${sanitizedRows.length} rows to ${tableName}`);
    }
  });
  // --- ATOMIC TRANSACTION END ---

  // STEP 5: RESTORE LOCALSTORAGE
  if (jsonData.storage) {
    console.log("Restoring LocalStorage settings...");
    Object.entries(jsonData.storage).forEach(([k, v]) => {
      if (typeof v === 'string') localStorage.setItem(k, v);
    });
  }

  console.log("NUCLEAR RESTORE: Success.");
};
