
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  targetNetWorth: number;
  targetDate: string;
  riskPerTrade: number;
  bullionCap: number;
  greedKillerRoi: number;
  loanPrincipal: number;
  loanInterest: number;
  ipoFreshIssueThreshold: number;
  allocationTargets: Record<string, number>; // New Field
  isEditMode: boolean; // Global dashboard edit mode
  isDarkMode: boolean;
  isHighContrast: boolean;

  // Real-Time Data Config
  dataMode: 'SIMULATION' | 'LIVE';
  apiKeys: {
    rapidApi?: string;
    alphaVantage?: string;
    finnhub?: string;
    fmp?: string;
  };
  geminiApiKey: string; // BYOK Support
  groqApiKey: string; // Groq API Key

  // Google Drive Sync
  googleDriveClientId: string;
  lastGoogleSyncTime: string | null;

  updateSetting: (key: keyof SettingsState, value: any) => void;
  resetDefaults: () => void;
}

const DEFAULTS = {
  targetNetWorth: 500000,
  targetDate: '2027-12-31',
  riskPerTrade: 2.0,
  bullionCap: 40,
  greedKillerRoi: 20,
  loanPrincipal: 353450,
  loanInterest: 7.4,
  ipoFreshIssueThreshold: 70,
  allocationTargets: {
    'Equity & Related': 55,
    'Commodities': 15,
    'Fixed Income': 20,
    'Crypto': 5,
    'Real Estate': 0,
    'Other': 5
  },
  isEditMode: false,

  dataMode: 'SIMULATION' as const,
  apiKeys: {
    rapidApi: '',
    alphaVantage: '',
    finnhub: '',
    fmp: ''
  },

  geminiApiKey: "",
  groqApiKey: "",

  // Google Drive Sync
  googleDriveClientId: "",
  lastGoogleSyncTime: null as string | null,

  isDarkMode: true, // Default to Dark Mode
  isHighContrast: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      updateSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
      resetDefaults: () => set(DEFAULTS)
    }),
    {
      name: 'wealth-aggregator-logic',
    }
  )
);
