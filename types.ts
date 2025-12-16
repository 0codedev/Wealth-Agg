
export enum InvestmentType {
  MUTUAL_FUND = 'Mutual Fund',
  DIGITAL_GOLD = 'Digital Gold',
  DIGITAL_SILVER = 'Digital Silver',
  SMALLCASE = 'Smallcase',
  STOCKS = 'Stocks',
  CRYPTO = 'Crypto',
  FD = 'Fixed Deposit',
  ETF = 'ETF',
  REAL_ESTATE = 'Real Estate',
  CASH = 'Cash/Bank',
  IPO = 'IPO',
  TRADING = 'Trading Alpha'
}

export enum RecurringFrequency {
  DAILY = 'Daily',
  MONTHLY = 'Monthly',
}

export interface RecurringConfig {
  isEnabled: boolean;
  frequency: RecurringFrequency;
  amount: number;
}

export interface Investment {
  id: string;
  name: string;
  ticker?: string;
  type: InvestmentType;
  platform: string;
  sector?: string;
  country?: string;
  tags?: string[];
  category?: 'PORTFOLIO' | 'TRADING_WALLET';
  investedAmount: number;
  currentValue: number;
  lastUpdated: string; // ISO Date string
  recurring?: RecurringConfig;
  isHiddenFromTotals?: boolean;
}

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface AggregatedData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export const CHART_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const ASSET_CLASS_COLORS: Record<string, string> = {
  'Equity & Related': '#4f46e5',
  'Commodities': '#f59e0b',
  'Crypto': '#8b5cf6',
  'Fixed Income': '#10b981',
  'Real Estate': '#ec4899',
  'Other': '#64748b',
};
