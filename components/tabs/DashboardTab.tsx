import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, 
  Sparkles, AlertTriangle, Zap, PieChart, Plus,
  ShieldCheck, Crosshair, BarChart3, AlertOctagon, Flame,
  Sliders, Activity, Layers, Trophy,
  Calendar, Gauge, Clock, CheckCircle2,
  LineChart, Coins, Milestone, Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, 
  Tooltip, CartesianGrid, XAxis, YAxis, 
  AreaChart, Area, BarChart, Bar, Line, ComposedChart, ReferenceLine
} from 'recharts';
import { Investment, CHART_COLORS, AggregatedData } from '../../types';
import * as AIService from '../../services/aiService';
import { calculateProgress5L, getCountdownToTarget } from '../../utils/helpers';
import { MarketStatus } from '../../hooks/useMarketSentiment';
import RoutineClock from '../RoutineClock';
import LoanWidget from '../LoanWidget';
import { useSettingsStore } from '../../store/settingsStore';
import { LifeEvent } from '../../database';

interface DashboardTabProps {
  investments: Investment[];
  stats: any;
  allocationData: AggregatedData[];
  assetClassData: AggregatedData[];
  platformData: AggregatedData[];
  projectionData: any[];
  isPrivacyMode: boolean;
  isDarkMode: boolean;
  onAddFirstAsset: () => void;
  formatCurrency: (val: number) => string;
  formatCurrencyPrecise: (val: number) => string;
  calculatePercentage: (part: number, total: number) => string;
  ASSET_CLASS_COLORS: Record<string, string>;
  CustomTooltip: any;
  marketVix: number;
  marketStatus: MarketStatus;
  // Synced Life Events
  lifeEvents: LifeEvent[];
  addLifeEvent: (event: Omit<LifeEvent, 'id'>) => Promise<void>;
  deleteLifeEvent: (id: number) => Promise<void>;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  investments, stats, allocationData, assetClassData, platformData, 
  projectionData, isPrivacyMode, isDarkMode, onAddFirstAsset,
  formatCurrency, formatCurrencyPrecise, calculatePercentage,
  ASSET_CLASS_COLORS, CustomTooltip, marketVix, marketStatus,
  lifeEvents, addLifeEvent, deleteLifeEvent
}) => {
  const [aiInsight, setAiInsight] = useState<{risk: string, tip: string} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [showLiability, setShowLiability] = useState(true);
  
  // New States for Life Events
  const [newEventName, setNewEventName] = useState('');
  const [newEventAmount, setNewEventAmount] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  const { targetNetWorth, targetDate } = useSettingsStore();
  
  const dynamicHealthScore = useMemo(() => {
     if (!showLiability) {
        const dScore = stats.diversityScore * 0.5;
        const pScore = (stats.totalPLPercent ? Math.min(100, 50 + parseFloat(stats.totalPLPercent)) : 50) * 0.5;
        return Math.min(100, Math.round(dScore + pScore));
     }
     return stats.healthScore;
  }, [showLiability, stats]);

  // Project 5L State
  const progress5L = parseFloat(calculateProgress5L(stats.totalAssets, targetNetWorth)); 
  const countdown = getCountdownToTarget(targetDate);
  const isGrindMode = progress5L < 10;

  const getProgressColor = (pct: number) => {
      if (pct < 30) return 'bg-rose-500';
      if (pct < 70) return 'bg-amber-500';
      return 'bg-emerald-500';
  };

  const progressColorClass = getProgressColor(progress5L);

  useEffect(() => {
    const fetchInsight = async () => {
        if (investments.length === 0) return;
        const CACHE_KEY = 'wealth_aggregator_ai_insight';
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            setAiInsight(JSON.parse(cached));
            return;
        }
        setIsAiLoading(true);
        try {
            const prompt = `Role: Senior Wealth Analyst. Portfolio: ${JSON.stringify(allocationData)}. Output JSON: { "risk": "max 15 words risk", "tip": "max 15 words tip" }`;
            const response = await AIService.askGemini(prompt, true);
            const cleanJson = response.replace(/```json|```/g, '').trim();
            setAiInsight(JSON.parse(cleanJson));
            sessionStorage.setItem(CACHE_KEY, cleanJson);
        } catch (e) { console.error("AI Insight Failed", e); } finally { setIsAiLoading(false); }
    };
    fetchInsight();
  }, [investments.length]); 

  const handleAddEvent = () => {
      if (!newEventName || !newEventAmount || !newEventDate) return;
      addLifeEvent({
          name: newEventName,
          amount: parseFloat(newEventAmount),
          date: newEventDate,
          type: 'EXPENSE'
      });
      setNewEventName('');
      setNewEventAmount('');
      setNewEventDate('');
  };

  const renderCommandCenter = () => {
      const isRed = marketStatus === 'RED';
      const statusColor = isRed ? 'text-rose-500' : marketStatus === 'AMBER' ? 'text-amber-500' : 'text-emerald-500';
      const statusBg = isRed ? 'bg-rose-500/10 border-rose-500/20' : marketStatus === 'AMBER' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2"><RoutineClock /></div>
            <div className={`rounded-xl border p-4 flex flex-col justify-center relative overflow-hidden ${statusBg} transition-all duration-500`}>
                {isRed && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>}
                <div className="flex items-center justify-between mb-2 relative z-10">
                     <h3 className={`font-bold text-sm tracking-wider uppercase flex items-center gap-2 ${statusColor}`}><Activity size={16} /> Market Status</h3>
                     <span className={`text-xs font-mono px-2 py-0.5 rounded bg-slate-900/50 border border-white/10 ${statusColor}`}>VIX: {marketVix}</span>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-full bg-slate-900 shadow-lg ${statusColor} ${isRed ? 'animate-pulse' : ''}`}>{isRed ? <AlertOctagon size={24}/> : <ShieldCheck size={24}/>}</div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isRed ? 'CRASH PROTOCOL' : marketStatus === 'AMBER' ? 'VOLATILITY WATCH' : 'STANDARD OPS'}</p>
                        <p className={`text-lg font-black tracking-tight ${statusColor}`}>{isRed ? 'DEFENSIVE' : marketStatus === 'AMBER' ? 'CAUTIOUS' : 'OPTIMAL'}</p>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderHeroSection = () => {
    const healthColor = dynamicHealthScore > 75 ? 'text-emerald-500' : dynamicHealthScore > 50 ? 'text-amber-500' : 'text-rose-500';
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-8 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{showLiability ? 'Real-Time Net Worth' : 'Gross Asset Value'}</p>
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <button onClick={() => setShowLiability(false)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!showLiability ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Gross</button>
                            <button onClick={() => setShowLiability(true)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${showLiability ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Net</button>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                         <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">{isPrivacyMode ? '••••••' : formatCurrency(showLiability ? stats.totalCurrent : stats.totalAssets)}</h1>
                    </div>
                    <div className="mt-8 grid grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p><p className="text-slate-700 dark:text-slate-200 font-mono text-lg font-semibold tabular-nums">{isPrivacyMode ? '••••' : formatCurrency(stats.totalAssets)}</p></div>
                        <div className={`transition-opacity duration-300 ${!showLiability ? 'opacity-40 grayscale' : 'opacity-100'}`}><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Liabilities</p><p className="text-rose-500 font-mono text-lg font-semibold tabular-nums">-{isPrivacyMode ? '••••' : formatCurrency(stats.totalLiability)}</p></div>
                        <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Health Score</p><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24"><div className={`h-full ${dynamicHealthScore > 75 ? 'bg-emerald-500' : dynamicHealthScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${dynamicHealthScore}%` }}></div></div><span className={`font-mono text-sm font-bold ${healthColor}`}>{dynamicHealthScore}</span></div></div>
                    </div>
                </div>
            </div>
            
            {/* MILESTONE TIMELINE (Quick Add) */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide"><Milestone size={16} className="text-indigo-500"/> Milestone Timeline</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[120px]">
                    {lifeEvents.length === 0 && <p className="text-xs text-slate-400 italic">No future events logged.</p>}
                    {lifeEvents.map(evt => (
                        <div key={evt.id} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{evt.name}</p>
                                <p className="text-[10px] text-slate-500">{evt.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-rose-500">-{formatCurrency(evt.amount)}</span>
                                <button onClick={() => evt.id && deleteLifeEvent(evt.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={12}/></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Add Life Event</p>
                    <div className="space-y-2">
                        <input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="e.g. Wedding" className="w-full p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"/>
                        <div className="flex gap-2">
                            <input type="number" value={newEventAmount} onChange={e => setNewEventAmount(e.target.value)} placeholder="₹ Amount" className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"/>
                            <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"/>
                        </div>
                        <button onClick={handleAddEvent} className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700">Add Milestone</button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
      {renderCommandCenter()}
      {investments.length > 0 && (
        <>
            {renderHeroSection()}
            
            {/* SIMULATOR CHART */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Sliders size={20} className="text-indigo-500"/> The Wealth Simulator
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Monte Carlo Projection (1000 Iterations) • Impact of Life Events</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500/20 rounded"></div> Bull Case (P90)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded"></div> Base Case (P50)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500/20 rounded"></div> Bear Case (P10)</div>
                    </div>
                </div>
                
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="bullRange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="bearRange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8'}} 
                                tickFormatter={(val) => val ? val.slice(0, 4) : ''}
                                interval={90} // Approx quarterly labels
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8'}} 
                                tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                formatter={(value: number, name: string) => [formatCurrency(value), name === 'base' ? 'Median' : name === 'bull' ? 'Bull Case' : 'Bear Case']}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            
                            {/* P90 Area */}
                            <Area type="monotone" dataKey="bull" stroke="none" fill="url(#bullRange)" />
                            
                            {/* P10 Area (Red) */}
                            <Area type="monotone" dataKey="bear" stroke="none" fill="url(#bearRange)" />

                            {/* P50 Line (Median) */}
                            <Line type="monotone" dataKey="base" stroke="#6366f1" strokeWidth={3} dot={false} />

                            {/* Life Event Markers */}
                            {projectionData.map((entry, index) => {
                                if (entry.eventMarker) {
                                    return <ReferenceLine key={index} x={entry.date} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Event', fill: '#f43f5e', fontSize: 10 }} />;
                                }
                                return null;
                            })}

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div><p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">{stats.totalPL >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} Total P/L</p><h3 className={`text-2xl font-bold mt-1 ${stats.totalPL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{stats.totalPL >= 0 ? '+' : ''}{isPrivacyMode ? '••••••' : formatCurrency(stats.totalPL)}</h3></div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${stats.totalPL >= 0 ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>{stats.totalPL >= 0 ? '+' : ''}{stats.totalPLPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex"><div className="h-full bg-slate-400 dark:bg-slate-600" style={{ width: '70%' }} title="Principal"></div><div className={`h-full ${stats.totalPL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '30%' }} title="P/L"></div></div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono"><span>INV: {formatCurrencyPrecise(stats.totalInvested)}</span><span>CUR: {formatCurrencyPrecise(stats.totalAssets)}</span></div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy size={80} className="text-amber-500"/></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><Target size={14} className="text-amber-500"/> Top Performer</p><h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{stats.topAsset.name}</h3></div>
                    <div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-slate-500">All-Time Return</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">+{stats.topAsset.percent.toFixed(1)}%</p></div><div className="text-right"><p className="text-[10px] text-slate-400">Impact</p><p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{calculatePercentage(stats.topAsset.value, stats.totalAssets)}% of Port.</p></div></div>
                </div>
                <LoanWidget />
            </div>
        </>
      )}
      
      {investments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4"><PieChart size={32} /></div><h3 className="text-lg font-semibold text-slate-900 dark:text-white">No investment data found</h3><button onClick={onAddFirstAsset} className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"><Plus size={20} /> Add First Asset</button></div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden h-full flex flex-col justify-between">
                        {isGrindMode && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-1"><Flame size={10} /> GRIND MODE</div>}
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-cyan-100 dark:bg-cyan-500/20 rounded text-cyan-600 dark:text-cyan-400"><Crosshair size={14} /></div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">PROJECT 5L</span>
                                </div>
                                <span className="text-xs font-mono text-slate-400">{progress5L}%</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Target: {formatCurrency(targetNetWorth)}</h4>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${progressColorClass}`} 
                                    style={{ width: `${progress5L}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 italic">Tracking Total Assets (ignoring debt).</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center"><span className="text-xs text-slate-400">Deadline: {targetDate.slice(0, 4)}</span><div className="text-right"><p className="text-[10px] uppercase text-slate-500">Time Left</p><p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{countdown.isExpired ? 'EXPIRED' : `${countdown.days}d ${countdown.hours}h`}</p></div></div>
                    </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"><div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-slate-800 dark:text-white">Exposure by Asset Type</h3><PieChart size={18} className="text-slate-400" /></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={80} paddingAngle={2} cornerRadius={4} stroke="none" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); if (percent < 0.05) return null; return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>);}}>{allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} cursor={false} /></RechartsPie></ResponsiveContainer></div></div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"><div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-slate-800 dark:text-white">Platform Diversification</h3><BarChart3 size={18} className="text-slate-400" /></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={[...platformData].sort((a,b) => b.value - a.value)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} stroke="none" /><Tooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }} content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} /><Bar dataKey="value" name="Current Value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} /></BarChart></ResponsiveContainer></div></div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default DashboardTab;