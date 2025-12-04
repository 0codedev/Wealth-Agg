
import { Trade, Dividend, IPOApplication, Strategy, DailyReview, LifeEvent, TaxRecord } from '../database';
import { Investment, HistoryEntry } from '../types';

export const BACKUP_SCHEMA_VERSION = 2; // Incremented version

// Comprehensive Data Interface
export interface DexieData {
  trades?: any[];
  dividends?: any[];
  ipo_applications?: any[];
  investments?: any[];
  history?: any[];
  // New Tables
  strategies?: any[];
  daily_reviews?: any[];
  life_events?: any[];
  tax_records?: any[];
}

export interface BackupSchema {
  version: number;
  timestamp: string;
  localStorage?: Record<string, string>; 
  dexie?: DexieData;
}
