
import Dexie, { type Table } from 'dexie';
import { Investment, HistoryEntry } from './types';

export type TradeDirection = 'Long' | 'Short';
export type MoodEntry = 'Focused' | 'Anxious' | 'Bored' | 'Revenge' | 'Greedy';
export type MoodExit = 'Satisfied' | 'Panic' | 'Regret' | 'Euphoric';
export type TradeMistake = 'FOMO' | 'Chasing' | 'No Stop Loss' | 'Overleveraged' | 'Early Exit' | 'Hesitation' | 'Revenge Trade' | 'News Trading';
// Changed to string to allow dynamic strategies
export type TradeSetup = string; 
export type SetupGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface Trade {
  id?: number;
  ticker: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  quantity: number;
  direction: TradeDirection;
  date: string; // ISO string
  entryTime?: string; // HH:mm format (Module 4)
  moodEntry: MoodEntry;
  moodExit: MoodExit;
  mistakes: string[];
  setup?: TradeSetup;
  grade?: SetupGrade;
  screenshot?: string | Blob;
  notes?: string;
  pnl?: number;
  riskRewardRatio?: number;
  fees?: number;
  mae?: number;
  mfe?: number;
  // Module 5: Compliance
  complianceScore?: number; // 0-100
}

export interface Dividend {
  id?: number;
  date: string;
  ticker: string;
  amount: number;
  credited: boolean;
}

export interface IPOApplication {
  id?: number;
  applicantName: string;
  ipoName: string;
  amount: number;
  status: 'BLOCKED' | 'ALLOTTED' | 'REFUNDED' | 'LISTED';
  upiHandle: string;
  appliedDate: string;
}

export interface TaxRecord {
  id?: number;
  fy: string;
  realizedLTCG: number;
  realizedSTCG: number;
  lastUpdated: string;
}

// Module 6: Strategy Rulebook
export interface Strategy {
  id?: number;
  name: string;
  description?: string;
  rules: string[]; // Checklist items
}

// Module 6: Daily Report Card
export interface DailyReview {
  date: string; // YYYY-MM-DD (Primary Key)
  rating: number; // 1-5 Stars
  marketCondition: 'Trending' | 'Choppy' | 'Volatile' | 'Sideways';
  notes: string;
  didWell: string;
  didPoorly: string;
}

// Module 7: Life Events (Wealth Simulator)
export interface LifeEvent {
  id?: number;
  name: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'EXPENSE' | 'INCOME';
}

export class TradeDatabase extends Dexie {
  trades!: Table<Trade>;
  dividends!: Table<Dividend>;
  ipo_applications!: Table<IPOApplication>;
  investments!: Table<Investment>;
  history!: Table<HistoryEntry>;
  tax_records!: Table<TaxRecord>;
  strategies!: Table<Strategy>;
  daily_reviews!: Table<DailyReview>;
  life_events!: Table<LifeEvent>;

  constructor() {
    super('WealthAggregatorDB');
    
    (this as any).version(1).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit' });
    (this as any).version(2).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup' });
    (this as any).version(3).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup', dividends: '++id, date, ticker' });
    (this as any).version(4).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle' });
    (this as any).version(5).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle', investments: 'id, type, platform', history: 'date' });
    (this as any).version(6).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle', investments: 'id, type, platform', history: 'date', tax_records: '++id, fy' });
    (this as any).version(7).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle', investments: 'id, type, platform', history: 'date', tax_records: '++id, fy' });
    (this as any).version(8).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup, grade', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle', investments: 'id, type, platform', history: 'date', tax_records: '++id, fy' });
    (this as any).version(9).stores({ trades: '++id, ticker, date, direction, moodEntry, moodExit, setup, grade, entryTime', dividends: '++id, date, ticker', ipo_applications: '++id, applicantName, ipoName, status, upiHandle', investments: 'id, type, platform', history: 'date', tax_records: '++id, fy' });
    (this as any).version(10).stores({
      trades: '++id, ticker, date, direction, moodEntry, moodExit, setup, grade, entryTime, complianceScore',
      dividends: '++id, date, ticker',
      ipo_applications: '++id, applicantName, ipoName, status, upiHandle',
      investments: 'id, type, platform',
      history: 'date',
      tax_records: '++id, fy',
      strategies: '++id, name',
      daily_reviews: 'date'
    });
    // Version 11: Life Events for Simulator
    (this as any).version(11).stores({
      trades: '++id, ticker, date, direction, moodEntry, moodExit, setup, grade, entryTime, complianceScore',
      dividends: '++id, date, ticker',
      ipo_applications: '++id, applicantName, ipoName, status, upiHandle',
      investments: 'id, type, platform',
      history: 'date',
      tax_records: '++id, fy',
      strategies: '++id, name',
      daily_reviews: 'date',
      life_events: '++id, date'
    });

    (this as any).on('populate', () => {
        this.strategies.bulkAdd([
            { name: 'Pullback', description: 'Buying the dip in an uptrend', rules: ['Trend is clearly UP', 'Price at Key Support/EMA', 'Volume declined on pullback', 'Bullish candle confirmation'] },
            { name: 'Breakout', description: 'Momentum entry above resistance', rules: ['Consolidation > 2 weeks', 'Volume spike on breakout', 'Relative Strength > Market', 'No immediate resistance overhead'] },
            { name: 'Reversal', description: 'Catching the turn', rules: ['Price at major support zone', 'RSI Divergence visible', 'Change of Character (ChoCH)', 'Stop loss below swing low'] }
        ]);
    });
  }
}

export const db = new TradeDatabase();

export const calculatePnL = (trade: Trade): number => {
  const diff = trade.exitPrice - trade.entryPrice;
  const grossPnL = trade.direction === 'Long' 
    ? diff * trade.quantity 
    : -diff * trade.quantity;
  
  return grossPnL - (trade.fees || 0);
};
