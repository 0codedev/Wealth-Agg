
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Investment, InvestmentType, RecurringFrequency } from '../types';
import { db, calculatePnL, LifeEvent } from '../database';
import { useSettingsStore } from '../store/settingsStore';
import { PROJECTION_WORKER_CODE } from '../workers/projection.worker';

// Constants
const DEFAULT_DATA: Investment[] = [
  {
    id: 'dhan-silver-etf',
    name: 'Aditya Birla Silver ETF',
    type: InvestmentType.ETF,
    platform: 'Dhan',
    category: 'PORTFOLIO',
    investedAmount: 153,
    currentValue: 154,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'dhan-kotak-fof',
    name: 'Kotak Gold Silver Passive FoF Fund Direct - Growth',
    type: InvestmentType.MUTUAL_FUND,
    platform: 'Dhan',
    category: 'PORTFOLIO',
    investedAmount: 100,
    currentValue: 108,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'dhan-motilal-midcap',
    name: 'Motilal Oswal Midcap Fund Direct - Growth',
    type: InvestmentType.MUTUAL_FUND,
    platform: 'Dhan',
    category: 'PORTFOLIO',
    investedAmount: 6000,
    currentValue: 6246,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'gullak-gold',
    name: 'Gullak Gold (24K 99.9%)',
    type: InvestmentType.DIGITAL_GOLD,
    platform: 'Gullak',
    category: 'PORTFOLIO',
    investedAmount: 1832,
    currentValue: 2234,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'gullak-silver',
    name: 'Gullak Silver (99.9% Pure)',
    type: InvestmentType.DIGITAL_SILVER,
    platform: 'Gullak',
    category: 'PORTFOLIO',
    investedAmount: 1803,
    currentValue: 2599,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'jar-gold',
    name: 'Jar Digital Gold (24K)',
    type: InvestmentType.DIGITAL_GOLD,
    platform: 'Jar',
    category: 'PORTFOLIO',
    investedAmount: 1555,
    currentValue: 1866,
    lastUpdated: new Date().toISOString(),
  }
];

const getAssetClass = (type: InvestmentType): string => {
  switch (type) {
    case InvestmentType.STOCKS:
    case InvestmentType.MUTUAL_FUND:
    case InvestmentType.SMALLCASE:
    case InvestmentType.ETF:
    case InvestmentType.TRADING: 
      return 'Equity & Related';
    case InvestmentType.DIGITAL_GOLD:
    case InvestmentType.DIGITAL_SILVER:
      return 'Commodities';
    case InvestmentType.CRYPTO:
      return 'Crypto';
    case InvestmentType.FD:
    case InvestmentType.CASH:
      return 'Fixed Income';
    case InvestmentType.REAL_ESTATE:
      return 'Real Estate';
    default:
      return 'Other';
  }
};

const calculatePercentage = (part: number, total: number) => {
  if (total === 0) return "0.0";
  return ((part / total) * 100).toFixed(1);
};

export const usePortfolio = () => {
  // --- Core State ---
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  
  // Inject Dynamic Logic Store
  const loanPrincipal = useSettingsStore(state => state.loanPrincipal);
  
  // Worker Ref
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    const blob = new Blob([PROJECTION_WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);
    workerRef.current.onmessage = (e) => {
      setProjectionData(e.data);
    };
    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // --- Persistence & Migration (IndexedDB) ---
  const refreshData = useCallback(async () => {
    // --- CRITICAL SAFETY LOCK ---
    // If we are restoring, DO NOT READ DB. It might be empty or in mid-transaction.
    if (sessionStorage.getItem('IS_RESTORING') === 'true') {
        return;
    }

    try {
        // --- 1. LOAD ALL DATA ---
        let currentInvestments = await db.investments.toArray();
        const currentEvents = await db.life_events.orderBy('date').toArray();
        setLifeEvents(currentEvents);
        
        // --- 2. DEFAULTS CHECK ---
        // Only load defaults if truly empty AND not restoring
        // This brings back sample data if user wiped everything
        if (currentInvestments.length === 0) {
            if (sessionStorage.getItem('IS_RESTORING') === 'true') return;

            // Simple fallback check
            const localData = localStorage.getItem('wealth_aggregator_data');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed)) currentInvestments = parsed;
                } catch(e) {}
            }
            
            // Inject Defaults if absolutely nothing exists
            if (currentInvestments.length === 0) {
               await db.investments.bulkPut(DEFAULT_DATA); 
               currentInvestments = await db.investments.toArray();
            }
        }

        // --- 3. TRADING WALLET SYNC ---
        const trades = await db.trades.toArray();
        const totalTradePnL = trades.reduce((acc, t) => acc + (calculatePnL(t) || 0), 0);
        
        let tradingWallet = currentInvestments.find(i => i.category === 'TRADING_WALLET');
        let hasUpdates = false;

        if (tradingWallet) {
             if (tradingWallet.currentValue !== totalTradePnL) {
                 tradingWallet.currentValue = totalTradePnL;
                 await db.investments.put(tradingWallet);
                 hasUpdates = true;
             }
        } else {
             // Create if missing
             await db.investments.put({
                 id: 'trading-wallet-main',
                 name: 'Trading Wallet (Alpha)',
                 type: InvestmentType.TRADING,
                 platform: 'Psych Journal',
                 category: 'TRADING_WALLET',
                 investedAmount: 0, 
                 currentValue: totalTradePnL,
                 lastUpdated: new Date().toISOString()
             });
             hasUpdates = true;
        }

        if (hasUpdates) {
            setInvestments(await db.investments.toArray());
        } else {
            setInvestments(currentInvestments);
        }

    } catch (error) {
        console.error("Database load error:", error);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- Calculations (Memoized) ---
  const stats = useMemo(() => {
    const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0);
    const totalAssets = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalCurrent = totalAssets - loanPrincipal;
    const totalPL = totalAssets - totalInvested;
    const totalPLPercent = calculatePercentage(totalPL, totalInvested);
    
    // Diversity Score
    let maxAssetShare = 0;
    investments.forEach(inv => {
        if (inv.currentValue > 0) {
            const share = inv.currentValue / totalAssets;
            if (share > maxAssetShare) maxAssetShare = share;
        }
    });
    const diversityScore = Math.max(0, Math.min(100, 100 - ((maxAssetShare - 0.25) * 120)));
    
    // Top Asset Logic
    let topAsset = { name: 'N/A', percent: -Infinity, value: 0 };
    investments.forEach(inv => {
        if (inv.investedAmount > 0) {
            const profit = inv.currentValue - inv.investedAmount;
            const percent = (profit / inv.investedAmount) * 100;
            if (percent > topAsset.percent) {
                topAsset = { name: inv.name, percent: percent, value: inv.currentValue };
            }
        }
    });

    const healthScore = Math.round((diversityScore * 0.6) + (totalPLPercent ? Math.min(40, parseFloat(totalPLPercent)) : 0));

    return { 
        totalInvested, 
        totalAssets, 
        totalCurrent, 
        totalLiability: loanPrincipal,
        totalPL, 
        totalPLPercent, 
        topAsset, 
        healthScore, 
        diversityScore 
    };
  }, [investments, loanPrincipal]);

  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach(inv => {
      if (inv.currentValue > 0) {
          map[inv.type] = (map[inv.type] || 0) + inv.currentValue;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [investments]);

  const assetClassData = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach(inv => {
        if (inv.currentValue > 0) {
            const cls = getAssetClass(inv.type);
            map[cls] = (map[cls] || 0) + inv.currentValue;
        }
    });
    return [...Object.entries(map)].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [investments]);

  const platformData = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach(inv => {
      if (inv.currentValue > 0) {
          map[inv.platform] = (map[inv.platform] || 0) + inv.currentValue;
      }
    });
    return [...Object.entries(map)].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [investments]);

  // --- History Logic & Worker Dispatch ---
  useEffect(() => {
    if (sessionStorage.getItem('IS_RESTORING') === 'true') return;

    const updateHistory = async () => {
        const today = new Date().toISOString().split('T')[0];
        const currentNetWorth = stats.totalCurrent;
        
        let history = await db.history.orderBy('date').toArray();

        // Initialize history if empty
        if (history.length === 0 && currentNetWorth !== 0) { 
            const simulatedHistory = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                simulatedHistory.push({
                    date: dateStr,
                    value: currentNetWorth // Flat start
                });
            }
            history = simulatedHistory;
            await db.history.bulkPut(history);
        } else if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            if (lastEntry.date !== today) {
                const newEntry = { date: today, value: currentNetWorth };
                await db.history.add(newEntry);
                history.push(newEntry);
            } else if (lastEntry.value !== currentNetWorth) {
                lastEntry.value = currentNetWorth;
                await db.history.put(lastEntry);
            }
        }
        
        if (workerRef.current) {
            workerRef.current.postMessage({ history, lifeEvents });
        }
    };

    updateHistory();
  }, [stats.totalCurrent, lifeEvents]);


  // --- Actions ---

  const refreshRecurringInvestments = useCallback(async () => {
    const now = new Date();
    const updatedInvestments: Investment[] = [];
    let hasChanges = false;

    const currentInvs = await db.investments.toArray();

    for (const inv of currentInvs) {
        if (!inv.recurring?.isEnabled) {
            updatedInvestments.push(inv);
            continue;
        }

        const lastUpdate = new Date(inv.lastUpdated);
        let periods = 0;

        if (inv.recurring.frequency === RecurringFrequency.DAILY) {
             const diffTime = now.getTime() - lastUpdate.getTime();
             const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             if (diffDays > 0) periods = diffDays;
        } else if (inv.recurring.frequency === RecurringFrequency.MONTHLY) {
             periods = (now.getFullYear() - lastUpdate.getFullYear()) * 12 + (now.getMonth() - lastUpdate.getMonth());
             if (now.getDate() < lastUpdate.getDate()) periods--; 
        }

        if (periods > 0) {
            const added = periods * inv.recurring.amount;
            const updatedInv = {
                ...inv,
                investedAmount: inv.investedAmount + added,
                currentValue: inv.currentValue + added,
                lastUpdated: now.toISOString()
            };
            updatedInvestments.push(updatedInv);
            hasChanges = true;
        } else {
            updatedInvestments.push(inv);
        }
    }

    if (hasChanges) {
        await db.investments.bulkPut(updatedInvestments);
        setInvestments(updatedInvestments);
    }
  }, []);

  const addInvestment = useCallback(async (invData: Omit<Investment, 'id'>) => {
    const entry: Investment = {
        ...invData,
        id: crypto.randomUUID(),
        category: 'PORTFOLIO', 
        lastUpdated: invData.lastUpdated || new Date().toISOString(),
    };
    await db.investments.add(entry);
    setInvestments(prev => [...prev, entry]);
  }, []);

  const updateInvestment = useCallback(async (id: string, invData: Partial<Investment>) => {
    const inv = await db.investments.get(id);
    if (inv) {
        const updated = { ...inv, ...invData, lastUpdated: invData.lastUpdated || inv.lastUpdated };
        await db.investments.put(updated);
        setInvestments(prev => prev.map(item => item.id === id ? updated : item));
    }
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    await db.investments.delete(id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  }, []);

  const addLifeEvent = useCallback(async (event: Omit<LifeEvent, 'id'>) => {
      const id = await db.life_events.add(event as LifeEvent);
      const newEvent = { ...event, id } as LifeEvent;
      setLifeEvents(prev => [...prev, newEvent].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, []);

  const deleteLifeEvent = useCallback(async (id: number) => {
      await db.life_events.delete(id);
      setLifeEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    investments,
    stats,
    allocationData,
    assetClassData,
    platformData,
    projectionData, 
    lifeEvents,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    refreshRecurringInvestments,
    refreshData,
    addLifeEvent,
    deleteLifeEvent
  };
};
