import { db } from '../database';
import { logger } from "./Logger";

// Keys to backup/restore from LocalStorage
const STORAGE_KEYS = [
  'wealth-aggregator-xp',
  'theme',
  'realized_ltcg_fy',
  'wealth-aggregator-logic',
  'wealth-aggregator-paper-trader',
  // Added Backup Keys (Audit Fix)
  'financial_mistakes',        // Mirror of Truth
  'advisor_chat_history',      // AI Advisor Chat
  'advisor_report_data',       // AI Advisor Reports
  'rebalance-targets',         // Strategy Rebalancing Config
  'academy_completed_items',   // Education Progress
  'fortress_notes',            // Fortress Private Notes
  'fortress_hash',             // Fortress Security Hash
  'dashboard-widget-order-v8', // Dashboard Layout Preference (v8: Refactored Layout with Smart Actions + Phase 8 Widgets)
  'trading-journal-prefs',     // Trading Journal View Settings (Sort, Filter, View Mode)
  'wealth-aggregator-alerts',  // Smart Alerts Store
  'category-rules-storage'     // Transaction Categorization Rules
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


/**
 * Convert JSON array to CSV string
 */
const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    logger.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const val = row[fieldName];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof val === 'string') {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(','))
  ].join('\n');

  try {
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    logger.error("CSV Export Failed:", err);
  }
}

/**
 * Exports current holdings as CSV
 */
export const handleExportHoldings = async () => {
  try {
    const holdings = await db.investments.toArray();
    if (holdings.length === 0) {
      alert("No holdings to export.");
      return;
    }

    // Format for readability
    const formatted = holdings.map(h => ({
      Name: h.name,
      Ticker: h.ticker || '',
      Type: h.type,
      Platform: h.platform,
      Quantity: h.quantity || 0,
      Invested: h.investedAmount,
      CurrentValue: h.currentValue,
      NetPL: h.currentValue - h.investedAmount,
      Sector: h.sector || '',
      LastUpdated: h.lastUpdated
    }));

    exportToCSV(formatted, `WealthHoldings_${new Date().toISOString().split('T')[0]}.csv`);
    logger.info("Holdings exported successfully");
  } catch (err) {
    logger.error("Failed to export holdings:", err);
    alert("Failed to export holdings");
  }
};