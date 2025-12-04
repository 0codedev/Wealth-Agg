
import React, { useEffect, useState, useMemo } from 'react';
import { db, Trade, calculatePnL, DailyReview } from '../database';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Sector, AreaChart, Area, CartesianGrid, ReferenceLine
} from 'recharts';
import { 
  Brain, Zap, Target, AlertTriangle, Skull, 
  TrendingUp, TrendingDown, Crosshair, Activity,
  Ghost, Calendar, LayoutDashboard, List, LineChart, Waves, Scale, BarChart2, Book, Grid,
  Clock, ToggleLeft, ToggleRight, RefreshCcw, BookOpen, Star, Plus, Edit2, Snowflake, X
} from 'lucide-react';
import { formatCurrency } from '../App';
import PnLCalendar from './journal/PnLCalendar';
import TradeHistoryTable from './journal/TradeHistoryTable';
import PlaybookGallery from './journal/PlaybookGallery'; 
import StrategyManagerModal from './journal/StrategyManagerModal';
import DailyReviewModal from './journal/DailyReviewModal';
import { calculateStreaks } from '../utils/helpers';

// --- VISUAL CONSTANTS ---
const RADIAN = Math.PI / 180;

type ViewMode = 'ANALYTICS' | 'JOURNAL' | 'PLAYBOOK';

const PsychDashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>([]);
  const [timeframe, setTimeframe] = useState<'ALL' | '30D' | '90D'>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('ANALYTICS');
  
  // For Journal View
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedDayReview, setSelectedDayReview] = useState<DailyReview | null>(null);

  // Modals
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
  const [isSlumpBusterOpen, setIsSlumpBusterOpen] = useState(false);

  // Module 4 State: "What If" Simulator
  const [ignoredMistakes, setIgnoredMistakes] = useState<string[]>([]);

  // Slump Logic
  const [slumpStats, setSlumpStats] = useState<{currentLoseStreak: number, bestTrade: Trade | null}>({currentLoseStreak: 0, bestTrade: null});

  useEffect(() => {
    loadTrades();
    loadDailyReviews();
  }, []);

  const loadTrades = async () => {
    const data = await db.trades.toArray();
    const enriched = data.map(t => {
        let r = t.riskRewardRatio || 0;
        if (!r && t.entryPrice && t.stopLoss && t.exitPrice) {
            const risk = Math.abs(t.entryPrice - t.stopLoss);
            if (risk > 0) {
                const reward = t.direction === 'Long' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
                r = reward / risk;
            }
        }
        return {
            ...t,
            pnl: calculatePnL(t),
            riskRewardRatio: r
        };
    });
    setTrades(enriched);
    
    // Slump Calculation
    const stats = calculateStreaks(enriched);
    setSlumpStats({
        currentLoseStreak: stats.currentLoseStreak,
        bestTrade: stats.bestTrade
    });

    // Trigger Slump Modal if streak >= 3
    if (stats.currentLoseStreak >= 3) {
        setIsSlumpBusterOpen(true);
    }
  };

  const loadDailyReviews = async () => {
      const reviews = await db.daily_reviews.toArray();
      setDailyReviews(reviews);
  };

  // Load Daily Review when date is selected
  useEffect(() => {
      if (selectedCalendarDate) {
          db.daily_reviews.get(selectedCalendarDate).then(setSelectedDayReview);
      } else {
          setSelectedDayReview(null);
      }
  }, [selectedCalendarDate]);

  const refreshDailyReview = () => {
      loadDailyReviews(); // Refresh all to update calendar dots
      if (selectedCalendarDate) {
          db.daily_reviews.get(selectedCalendarDate).then(setSelectedDayReview);
      }
  };

  const filteredTrades = useMemo(() => {
    if (viewMode === 'JOURNAL') {
        if (selectedCalendarDate) {
            return trades.filter(t => t.date === selectedCalendarDate);
        }
        return trades.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    }

    if (viewMode === 'PLAYBOOK') {
        return trades;
    }

    // Analytics Filters
    if (timeframe === 'ALL') return trades;
    const now = new Date();
    const days = timeframe === '30D' ? 30 : 90;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return trades.filter(t => new Date(t.date) >= cutoff);
  }, [trades, timeframe, viewMode, selectedCalendarDate]);

  // --- MODULE 1: EQUITY CURVE ENGINE ---
  const equityData = useMemo(() => {
      const sorted = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const dailyMap: Record<string, number> = {};
      sorted.forEach(t => {
          dailyMap[t.date] = (dailyMap[t.date] || 0) + (t.pnl || 0);
      });

      let runningTotal = 0;
      let peak = 0;
      const curve = Object.entries(dailyMap).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, dailyPnL]) => {
          runningTotal += dailyPnL;
          if (runningTotal > peak) peak = runningTotal;
          const drawdown = runningTotal - peak;
          
          return {
              date,
              dailyPnL,
              equity: runningTotal,
              drawdown: drawdown, 
              peak: peak
          };
      });

      if (curve.length === 0) return [];
      return curve;
  }, [filteredTrades]);

  const maxDrawdown = useMemo(() => {
      if (equityData.length === 0) return 0;
      return Math.min(...equityData.map(d => d.drawdown));
  }, [equityData]);

  // --- MODULE 2: EXPECTANCY ENGINE ---
  const expectancyStats = useMemo(() => {
      let totalR = 0;
      let winR = 0;
      let lossR = 0;
      let wins = 0;
      let losses = 0;
      
      const distribution = {
          '<-2R': 0,
          '-2R to -1R': 0,
          '-1R to 0R': 0,
          '0R to 1R': 0,
          '1R to 2R': 0,
          '2R to 3R': 0,
          '>3R': 0
      };

      filteredTrades.forEach(t => {
          const r = t.riskRewardRatio || 0;
          totalR += r;
          
          if (r > 0) {
              winR += r;
              wins++;
          } else if (r < 0) {
              lossR += r;
              losses++;
          }

          if (r < -2) distribution['<-2R']++;
          else if (r < -1) distribution['-2R to -1R']++;
          else if (r < 0) distribution['-1R to 0R']++;
          else if (r < 1) distribution['0R to 1R']++;
          else if (r < 2) distribution['1R to 2R']++;
          else if (r < 3) distribution['2R to 3R']++;
          else distribution['>3R']++;
      });

      const count = filteredTrades.length || 1;
      const expectancy = totalR / count;
      const avgWinR = wins > 0 ? winR / wins : 0;
      const avgLossR = losses > 0 ? lossR / losses : 0;

      const chartData = Object.entries(distribution).map(([name, val]) => ({ name, value: val }));

      return { expectancy, avgWinR, avgLossR, chartData };
  }, [filteredTrades]);

  // --- MODULE 4: BEHAVIORAL ANALYTICS ---
  const hourlyStats = useMemo(() => {
      const map: Record<string, { pnl: number, count: number }> = {};
      // Initialize buckets
      ['09', '10', '11', '12', '13', '14', '15'].forEach(h => map[h] = { pnl: 0, count: 0 });

      filteredTrades.forEach(t => {
          if (t.entryTime) {
              const hour = t.entryTime.split(':')[0]; // "09:15" -> "09"
              if (map[hour]) {
                  map[hour].pnl += (t.pnl || 0);
                  map[hour].count++;
              }
          }
      });

      return Object.entries(map).map(([hour, data]) => ({
          hour: `${hour}:00`,
          pnl: data.pnl,
          count: data.count
      }));
  }, [filteredTrades]);

  const directionalStats = useMemo(() => {
      let longPnL = 0, shortPnL = 0;
      let longCount = 0, shortCount = 0;
      let longWins = 0, shortWins = 0;

      filteredTrades.forEach(t => {
          if (t.direction === 'Long') {
              longPnL += (t.pnl || 0);
              longCount++;
              if ((t.pnl || 0) > 0) longWins++;
          } else {
              shortPnL += (t.pnl || 0);
              shortCount++;
              if ((t.pnl || 0) > 0) shortWins++;
          }
      });

      return {
          long: { pnl: longPnL, count: longCount, winRate: longCount > 0 ? (longWins/longCount)*100 : 0 },
          short: { pnl: shortPnL, count: shortCount, winRate: shortCount > 0 ? (shortWins/shortCount)*100 : 0 }
      };
  }, [filteredTrades]);

  const whatIfStats = useMemo(() => {
      const actualPnL = filteredTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
      let potentialPnL = 0;
      
      potentialPnL = filteredTrades.reduce((acc, t) => {
          if (t.mistakes?.some(m => ignoredMistakes.includes(m))) return acc;
          return acc + (t.pnl || 0);
      }, 0);

      const diff = potentialPnL - actualPnL;

      return { actualPnL, potentialPnL, diff };
  }, [filteredTrades, ignoredMistakes]);

  const allMistakes = useMemo(() => {
      const set = new Set<string>();
      filteredTrades.forEach(t => t.mistakes?.forEach(m => set.add(m)));
      return Array.from(set);
  }, [filteredTrades]);

  // --- ANALYTICS ENGINES ---
  const tiltStats = useMemo(() => {
      const emotionalStates = ['Anxious', 'Revenge', 'Greedy', 'Panic', 'Regret', 'Euphoric'];
      const total = filteredTrades.length;
      if (total === 0) return { score: 0, label: 'NO DATA', color: '#64748b' };
      let tiltCount = 0;
      filteredTrades.forEach(t => {
          if (emotionalStates.includes(t.moodEntry) || emotionalStates.includes(t.moodExit)) {
              tiltCount++;
          }
      });
      const score = Math.min(100, Math.round((tiltCount / total) * 100));
      let label = 'ZEN MASTER';
      let color = '#10b981'; // Green
      if (score > 20) { label = 'FOCUSED'; color = '#34d399'; }
      if (score > 40) { label = 'DISTRACTED'; color = '#f59e0b'; }
      if (score > 60) { label = 'ON TILT'; color = '#f43f5e'; }
      if (score > 80) { label = 'RAGE TRADING'; color = '#ef4444'; }
      return { score, label, color, tiltCount, total };
  }, [filteredTrades]);

  const edgeData = useMemo(() => {
      const map: Record<string, { wins: number, loss: number, totalPnL: number, count: number }> = {};
      filteredTrades.forEach(t => {
          const setup = t.setup || 'No Setup';
          if (!map[setup]) map[setup] = { wins: 0, loss: 0, totalPnL: 0, count: 0 };
          map[setup].count++;
          map[setup].totalPnL += (t.pnl || 0);
          if ((t.pnl || 0) > 0) map[setup].wins++;
          else map[setup].loss++;
      });
      return Object.entries(map)
          .map(([name, data]) => ({
              name,
              winRate: (data.wins / data.count) * 100,
              avgPnL: data.totalPnL / data.count,
              totalPnL: data.totalPnL,
              count: data.count,
              profitFactor: Math.abs(data.wins / (data.loss || 1))
          }))
          .sort((a, b) => b.totalPnL - a.totalPnL);
  }, [filteredTrades]);

  const mistakeData = useMemo(() => {
      const map: Record<string, { cost: number, count: number }> = {};
      filteredTrades.forEach(t => {
          if ((t.pnl || 0) < 0 && t.mistakes && t.mistakes.length > 0) {
              t.mistakes.forEach(m => {
                  if (!map[m]) map[m] = { cost: 0, count: 0 };
                  map[m].count++;
                  map[m].cost += Math.abs(t.pnl || 0);
              });
          }
      });
      return Object.entries(map)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 6);
  }, [filteredTrades]);

  const needle = (value: number, cx: number, cy: number, iR: number, oR: number, color: string) => {
    const total = 180;
    const ang = 180 - (value / 100) * total;
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 5;
    const x0 = cx + 5;
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;
    return [
      <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" key="circle"/>,
      <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill={color} key="path"/>
    ];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      
      {/* SLUMP BUSTER MODAL */}
      {isSlumpBusterOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
              <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_100px_rgba(225,29,72,0.5)]">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                      <Snowflake size={120} className="text-rose-500 animate-spin-slow"/>
                  </div>
                  
                  <div className="relative z-10">
                      <div className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/40">
                          <Brain size={40} className="text-white"/>
                      </div>
                      
                      <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Protocol Active</h2>
                      <p className="text-rose-400 font-bold text-sm mb-6 uppercase tracking-widest">3-Day Losing Streak Detected</p>
                      
                      <p className="text-slate-300 mb-8 leading-relaxed">
                          Trading is currently locked. To break the cycle, you must reconnect with your best performance.
                      </p>

                      {slumpStats.bestTrade ? (
                          <div className="bg-slate-800 rounded-xl p-4 border border-emerald-500/30 mb-8 text-left">
                              <p className="text-[10px] text-emerald-400 uppercase font-bold mb-2 flex items-center gap-1">
                                  <Target size={12}/> Your Best Trade
                              </p>
                              <div className="flex justify-between items-end">
                                  <div>
                                      <p className="text-xl font-black text-white">{slumpStats.bestTrade.ticker}</p>
                                      <p className="text-xs text-slate-400">{slumpStats.bestTrade.setup}</p>
                                  </div>
                                  <p className="text-2xl font-mono font-bold text-emerald-400">+{formatCurrency(slumpStats.bestTrade.pnl || 0)}</p>
                              </div>
                              {slumpStats.bestTrade.notes && (
                                  <p className="mt-3 text-xs text-slate-300 italic border-t border-slate-700 pt-2">
                                      "{slumpStats.bestTrade.notes}"
                                  </p>
                              )}
                          </div>
                      ) : (
                          <p className="text-sm text-slate-500 italic mb-8">No wins recorded yet. Visualize your first win.</p>
                      )}

                      <button 
                          onClick={() => setIsSlumpBusterOpen(false)}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                      >
                          I HAVE REVIEWED MY EDGE
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex items-center">
               <button 
                  onClick={() => setViewMode('ANALYTICS')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'ANALYTICS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
               >
                   <LayoutDashboard size={16} /> Analytics
               </button>
               <button 
                  onClick={() => setViewMode('JOURNAL')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'JOURNAL' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
               >
                   <Calendar size={16} /> Journal
               </button>
               <button 
                  onClick={() => setViewMode('PLAYBOOK')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'PLAYBOOK' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
               >
                   <Grid size={16} /> Playbook
               </button>
          </div>

          <div className="flex items-center gap-2">
              {slumpStats.currentLoseStreak > 0 && (
                  <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold border border-rose-500/20 flex items-center gap-1">
                      <Snowflake size={12}/> Streak: -{slumpStats.currentLoseStreak}
                  </div>
              )}
              
              <button 
                  onClick={() => setIsStrategyModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-colors"
              >
                  <BookOpen size={16} /> Strategy Vault
              </button>
              
              {viewMode === 'ANALYTICS' && (
                  <div className="flex space-x-2">
                      {['ALL', '30D', '90D'].map((t) => (
                          <button 
                              key={t}
                              onClick={() => setTimeframe(t as any)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                          >
                              {t}
                          </button>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {viewMode === 'JOURNAL' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <PnLCalendar 
                  trades={trades} 
                  dailyReviews={dailyReviews}
                  selectedDate={selectedCalendarDate}
                  onDateSelect={setSelectedCalendarDate} 
              />
              
              {/* Daily Report Card Section */}
              {selectedCalendarDate && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                      {selectedDayReview ? (
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                          <Book size={20} className="text-indigo-500"/> Daily Report Card
                                      </h3>
                                      <p className="text-sm text-slate-500">Self-Review for {selectedCalendarDate}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <div className="flex gap-1">
                                          {[1,2,3,4,5].map(s => <Star key={s} size={16} className={selectedDayReview.rating >= s ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700"} />)}
                                      </div>
                                      <button onClick={() => setIsDailyReviewModalOpen(true)} className="ml-4 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500">
                                          <Edit2 size={16}/>
                                      </button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">What went well</span>
                                      <p className="text-slate-700 dark:text-slate-300">{selectedDayReview.didWell || 'No notes.'}</p>
                                  </div>
                                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <span className="text-xs font-bold text-rose-500 uppercase block mb-1">What went wrong</span>
                                      <p className="text-slate-700 dark:text-slate-300">{selectedDayReview.didPoorly || 'No notes.'}</p>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-6">
                              <p className="text-slate-500 mb-4">No daily review logged for {selectedCalendarDate}.</p>
                              <button 
                                onClick={() => setIsDailyReviewModalOpen(true)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
                              >
                                  <Plus size={16}/> Add Daily Review
                              </button>
                          </div>
                      )}
                  </div>
              )}

              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <List size={20} className="text-indigo-500"/> 
                          {selectedCalendarDate ? `Log for ${selectedCalendarDate}` : 'Comprehensive Trade Log'}
                      </h3>
                      {selectedCalendarDate && (
                          <button 
                            onClick={() => setSelectedCalendarDate(null)}
                            className="text-xs text-indigo-500 font-bold hover:underline"
                          >
                              Show All
                          </button>
                      )}
                  </div>
                  <TradeHistoryTable trades={filteredTrades} />
              </div>
          </div>
      ) : viewMode === 'PLAYBOOK' ? (
          <PlaybookGallery trades={trades} />
      ) : (
          /* --- ANALYTICS VIEW --- */
          <div className="space-y-6 animate-in slide-in-from-left-4">
              
              {/* --- MODULE 1: PERFORMANCE TRAJECTORY --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* EQUITY CURVE */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                          <div>
                              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                  <LineChart size={16} className="text-indigo-500"/> The Equity Curve
                              </h3>
                              <p className="text-xs text-slate-400">Cumulative PnL Performance</p>
                          </div>
                          {equityData.length > 0 && (
                             <div className={`px-3 py-1 rounded-lg text-sm font-black font-mono ${equityData[equityData.length-1].equity >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                 {formatCurrency(equityData[equityData.length-1].equity)}
                             </div>
                          )}
                      </div>
                      <div className="h-64 w-full">
                          {equityData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={equityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                      <XAxis dataKey="date" hide />
                                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `₹${val/1000}k`} />
                                      <Tooltip 
                                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                          formatter={(value: number) => [formatCurrency(value), 'Total PnL']}
                                          labelStyle={{ color: '#94a3b8' }}
                                      />
                                      <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />
                                      <Area 
                                          type="monotone" 
                                          dataKey="equity" 
                                          stroke="#6366f1" 
                                          strokeWidth={3}
                                          fillOpacity={1} 
                                          fill="url(#colorEquity)" 
                                      />
                                  </AreaChart>
                              </ResponsiveContainer>
                          ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                  Log trades to visualize your curve.
                              </div>
                          )}
                      </div>
                  </div>

                  {/* DRAWDOWN CHART */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                       <div className="flex items-center justify-between mb-6">
                          <div>
                              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                  <Waves size={16} className="text-rose-500"/> Underwater
                              </h3>
                              <p className="text-xs text-slate-400">Drawdown from Peak</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Max DD</p>
                              <p className="text-sm font-black font-mono text-rose-500">{formatCurrency(maxDrawdown)}</p>
                          </div>
                      </div>
                      <div className="h-64 w-full">
                          {equityData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={equityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                      <XAxis dataKey="date" hide />
                                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `₹${val/1000}k`} />
                                      <Tooltip 
                                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                          formatter={(value: number) => [formatCurrency(value), 'Drawdown']}
                                          labelStyle={{ color: '#94a3b8' }}
                                      />
                                      <Area 
                                          type="step" 
                                          dataKey="drawdown" 
                                          stroke="#f43f5e" 
                                          strokeWidth={2}
                                          fillOpacity={1} 
                                          fill="url(#colorDD)" 
                                      />
                                  </AreaChart>
                              </ResponsiveContainer>
                          ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                  No drawdown data.
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* --- MODULE 2: THE EXPECTANCY ENGINE --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Scale size={80} className="text-indigo-500"/>
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Brain size={16} className="text-indigo-500"/> Expectancy Engine
                      </h3>
                      <div className="mb-6">
                          <p className="text-xs text-slate-500 mb-1">System Expectancy</p>
                          <p className={`text-4xl font-black font-mono ${expectancyStats.expectancy > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {expectancyStats.expectancy > 0 ? '+' : ''}{expectancyStats.expectancy.toFixed(2)}R
                          </p>
                          <p className="text-xs text-slate-500 mt-2">Avg return per trade risk unit.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                          <div>
                              <p className="text-[10px] uppercase text-slate-500 font-bold">Avg Win</p>
                              <p className="text-lg font-bold text-emerald-400">+{expectancyStats.avgWinR.toFixed(2)}R</p>
                          </div>
                          <div>
                              <p className="text-[10px] uppercase text-slate-500 font-bold">Avg Loss</p>
                              <p className="text-lg font-bold text-rose-400">{expectancyStats.avgLossR.toFixed(2)}R</p>
                          </div>
                      </div>
                  </div>
                  <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                          <BarChart2 size={16} className="text-cyan-500"/> R-Multiple Distribution
                      </h3>
                      <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={expectancyStats.chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                  <YAxis hide />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                      cursor={{fill: 'transparent'}}
                                  />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                      {expectancyStats.chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={index < 3 ? '#f43f5e' : index === 3 ? '#94a3b8' : '#10b981'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* TILT & COST OF ERRORS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-50"></div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={16} /> Tilt-O-Meter
                    </h3>
                    <div className="w-full h-48 relative flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    dataKey="value"
                                    startAngle={180}
                                    endAngle={0}
                                    data={[
                                        { name: 'Zen', value: 33, color: '#10b981' },
                                        { name: 'Neutral', value: 33, color: '#f59e0b' },
                                        { name: 'Tilt', value: 34, color: '#ef4444' },
                                    ]}
                                    cx="50%"
                                    cy="70%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    stroke="none"
                                >
                                    { [
                                        { name: 'Zen', value: 33, color: '#10b981' },
                                        { name: 'Neutral', value: 33, color: '#f59e0b' },
                                        { name: 'Tilt', value: 34, color: '#ef4444' },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                {needle(tiltStats.score, 0, 0, 60, 80, tiltStats.color)}
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-10 flex flex-col items-center">
                            <h2 className="text-3xl font-black" style={{ color: tiltStats.color }}>{tiltStats.score}%</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{tiltStats.label}</p>
                        </div>
                    </div>
                    <div className="w-full mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                        <p className="text-xs text-slate-500 mb-1">Impact Analysis</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            You trade <span className="font-bold text-slate-900 dark:text-white">{tiltStats.score > 50 ? 'WORSE' : 'BETTER'}</span> when emotional.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Skull size={16} className="text-rose-500"/> The Cost of Errors
                        </h3>
                        <span className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded">
                            Total Waste: {formatCurrency(mistakeData.reduce((a,b) => a + b.cost, 0))}
                        </span>
                    </div>
                    {mistakeData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            No mistakes logged yet. Good job!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mistakeData.map((m) => (
                                <div key={m.name} className="relative group">
                                    <div className="flex items-center justify-between text-sm relative z-10 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                                            <span className="text-xs text-slate-400">({m.count}x)</span>
                                        </div>
                                        <span className="font-mono font-bold text-rose-500">-{formatCurrency(m.cost)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-rose-500 rounded-full" 
                                            style={{ width: `${(m.cost / mistakeData[0].cost) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>

              {/* 3. THE EDGE FINDER */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <Crosshair className="text-cyan-400" /> The Edge Finder
                          </h3>
                          <p className="text-sm text-slate-400">Correlation Matrix: Strategy vs. Performance</p>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-950 text-slate-500 uppercase font-bold text-xs tracking-wider">
                              <tr>
                                  <th className="p-4">Strategy / Setup</th>
                                  <th className="p-4 text-center">Count</th>
                                  <th className="p-4 text-center">Win Rate</th>
                                  <th className="p-4 text-right">Avg PnL</th>
                                  <th className="p-4 text-right">Total Net</th>
                                  <th className="p-4 text-center">Rating</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {edgeData.map((edge) => {
                                  const isA_Plus = edge.winRate > 50 && edge.totalPnL > 0;
                                  const isBleeding = edge.totalPnL < 0;
                                  return (
                                      <tr key={edge.name} className="hover:bg-slate-800/50 transition-colors group">
                                          <td className="p-4 font-bold text-white flex items-center gap-2">
                                              {isA_Plus && <Target size={14} className="text-emerald-500" />}
                                              {isBleeding && <Ghost size={14} className="text-rose-500" />}
                                              {edge.name}
                                          </td>
                                          <td className="p-4 text-center text-slate-400">{edge.count}</td>
                                          <td className="p-4 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                      <div className={`h-full ${edge.winRate > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${edge.winRate}%` }}></div>
                                                  </div>
                                                  <span className={`text-xs font-mono ${edge.winRate > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{edge.winRate.toFixed(0)}%</span>
                                              </div>
                                          </td>
                                          <td className={`p-4 text-right font-mono ${edge.avgPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(edge.avgPnL)}</td>
                                          <td className={`p-4 text-right font-mono font-bold text-base ${edge.totalPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{edge.totalPnL > 0 ? '+' : ''}{formatCurrency(edge.totalPnL)}</td>
                                          <td className="p-4 text-center">
                                              {isA_Plus ? <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">A+</span> : isBleeding ? <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs font-bold">F</span> : <span className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs font-bold">C</span>}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {edgeData.length === 0 && (
                                  <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Log more trades to unlock your Edge Matrix.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* --- MODULE 4: BEHAVIORAL ANALYTICS & WHAT-IF ENGINE --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* TIME & DIRECTION ANALYSIS */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={16} className="text-indigo-500"/> Chronobiology
                          </h3>
                      </div>
                      <div className="h-48 w-full mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={hourlyStats}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                  <XAxis dataKey="hour" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                  <YAxis hide />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                      cursor={{fill: 'transparent'}}
                                  />
                                  <Bar dataKey="pnl">
                                      {hourlyStats.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
                                  <TrendingUp size={12}/> Long Bias
                              </p>
                              <div className="flex justify-between items-end">
                                  <span className={`text-sm font-black font-mono ${directionalStats.long.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>{formatCurrency(directionalStats.long.pnl)}</span>
                                  <span className="text-[10px] text-slate-400">{directionalStats.long.winRate.toFixed(0)}% WR</span>
                              </div>
                          </div>
                          <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800/30">
                              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase mb-1 flex items-center gap-1">
                                  <TrendingDown size={12}/> Short Bias
                              </p>
                              <div className="flex justify-between items-end">
                                  <span className={`text-sm font-black font-mono ${directionalStats.short.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(directionalStats.short.pnl)}</span>
                                  <span className="text-[10px] text-slate-400">{directionalStats.short.winRate.toFixed(0)}% WR</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* THE WHAT-IF ENGINE */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                          <RefreshCcw size={100} className="text-indigo-500" />
                      </div>
                      
                      <div className="relative z-10">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                              <RefreshCcw size={20} className="text-indigo-400"/> The What-If Simulator
                          </h3>
                          <p className="text-xs text-slate-400 mb-6">Eliminate specific mistakes to see your potential.</p>

                          <div className="flex flex-wrap gap-2 mb-6">
                              {allMistakes.map(m => (
                                  <button
                                      key={m}
                                      onClick={() => setIgnoredMistakes(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${ignoredMistakes.includes(m) ? 'bg-rose-500/20 border-rose-500 text-rose-400 line-through opacity-70' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500'}`}
                                  >
                                      {ignoredMistakes.includes(m) ? <ToggleLeft size={14}/> : <ToggleRight size={14}/>} {m}
                                  </button>
                              ))}
                              {allMistakes.length === 0 && <span className="text-xs text-slate-600 italic">No mistakes logged yet.</span>}
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Actual PnL</span>
                                  <span className={`font-mono font-bold ${whatIfStats.actualPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(whatIfStats.actualPnL)}</span>
                              </div>
                              <div className="flex justify-between items-center bg-indigo-900/10 p-3 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
                                  <span className="text-xs font-bold text-indigo-300 uppercase relative z-10 flex items-center gap-2"><Zap size={12}/> Potential PnL</span>
                                  <span className={`font-mono font-bold relative z-10 text-xl ${whatIfStats.potentialPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(whatIfStats.potentialPnL)}</span>
                              </div>
                              
                              {whatIfStats.diff > 0 && (
                                  <div className="text-center">
                                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Cost of Bad Habits</p>
                                      <p className="text-lg font-black text-rose-500">{formatCurrency(whatIfStats.diff)}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      )}

      {/* Modals */}
      <StrategyManagerModal 
        isOpen={isStrategyModalOpen} 
        onClose={() => setIsStrategyModalOpen(false)} 
      />
      
      {selectedCalendarDate && (
          <DailyReviewModal 
            date={selectedCalendarDate}
            isOpen={isDailyReviewModalOpen}
            onClose={() => setIsDailyReviewModalOpen(false)}
            onSave={refreshDailyReview}
          />
      )}
    </div>
  );
};

export default PsychDashboard;
