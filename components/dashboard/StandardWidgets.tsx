import React, { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Users,
    ArrowRight, Wallet, CreditCard, Layers, Trophy, Target, ArrowUpRight,
    Landmark, AlertTriangle, Droplet
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Investment, AggregatedData } from '../../types';

const FALLBACK_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6', '#f59e0b'];

// ==========================================
// Types
// ==========================================

interface CommonWidgetProps {
    id?: string;
    dragHandle?: boolean;
    onClick?: () => void;
}

// Helper to calculate top performer
const getTopPerformer = (investments: Investment[]) => {
    if (!investments.length) return null;
    return investments.reduce((prev, current) => {
        const prevGain = ((prev.currentValue - prev.investedAmount) / prev.investedAmount) * 100;
        const currentGain = ((current.currentValue - current.investedAmount) / current.investedAmount) * 100;
        return (prevGain > currentGain) ? prev : current;
    });
};

// ==========================================
// 1. Total P&L Widget (Refined)
// ==========================================

export const TotalPLWidget: React.FC<CommonWidgetProps & {
    stats: any;
    isPrivacyMode: boolean;
    formatCurrency: (val: number) => string;
    formatCurrencyPrecise: (val: number) => string;
}> = ({ stats, isPrivacyMode, formatCurrency }) => {
    const isPositive = stats.totalPL >= 0;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={100} className={isPositive ? "text-emerald-500" : "text-rose-500"} />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                        <TrendingUp size={20} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {stats.totalPLPercent}%
                    </span>
                </div>

                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4">Total Profit/Loss</p>
                <div className="mt-1 text-3xl font-black text-white flex items-center gap-2 tracking-tight">
                    {isPrivacyMode ? '••••••' : formatCurrency(stats.totalPL)}
                </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Invested</p>
                        <p className="text-sm font-bold text-slate-300 font-mono">{isPrivacyMode ? '•••' : formatCurrency(stats.totalInvested)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Current</p>
                        <p className="text-sm font-bold text-white font-mono">{isPrivacyMode ? '•••' : formatCurrency(stats.totalCurrent)}</p>
                    </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div
                        className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(parseFloat(String(stats.totalPLPercent))))}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. Top Performer Widget (Real Logic)
// ==========================================

export const TopPerformerWidget: React.FC<CommonWidgetProps & {
    stats: any;
    investments?: Investment[];
    calculatePercentage: (a: number, b: number) => string;
}> = ({ stats, investments }) => {
    // Calculate real top performer from investments prop
    const topPerformer = useMemo(() => {
        if (!investments || investments.length === 0) return null;
        return getTopPerformer(investments);
    }, [investments]);

    // Format data
    const name = topPerformer ? topPerformer.name : 'No Investments';
    const returnVal = topPerformer ? ((topPerformer.currentValue - topPerformer.investedAmount) / topPerformer.investedAmount * 100).toFixed(1) : '0.0';
    const isPositive = parseFloat(returnVal) >= 0;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={100} className="text-amber-500" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        <Trophy size={20} />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-full uppercase tracking-wide">All-Time High</span>
                </div>

                <div className="mt-4">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Top Performer</p>
                    <h3 className="text-xl font-bold text-white truncate pr-4" title={name}>{name}</h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Total Return</p>
                        <p className={`text-2xl font-black flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <ArrowUpRight size={20} /> {isPositive ? '+' : ''}{returnVal}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Impact</p>
                        <p className="text-sm font-bold text-slate-300">High</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. Shortcuts (Spending, Market, Community) - Enhanced UI
// ==========================================

export const SpendingWidget: React.FC<CommonWidgetProps> = ({ onClick }) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                <CreditCard size={24} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <ArrowRight size={14} />
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Spending Analytics</h3>
            <p className="text-xs text-slate-500 mt-1">Track expenses & budgeting</p>
        </div>
    </div>
);

export const MarketWidget: React.FC<CommonWidgetProps> = ({ onClick }) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/50 transition-all group flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                <Activity size={24} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ArrowRight size={14} />
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Market Insights</h3>
            <p className="text-xs text-slate-500 mt-1">Trends, News & Sentiment</p>
        </div>
    </div>
);

export const CommunityWidget: React.FC<CommonWidgetProps> = ({ onClick }) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                <Users size={24} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                <ArrowRight size={14} />
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Community</h3>
            <p className="text-xs text-slate-500 mt-1">Connect with investors</p>
        </div>
    </div>
);

// ==========================================
// 4. Loan Widget Wrapper (Enhanced)
// ==========================================

export const LoanWidgetWrapper: React.FC<CommonWidgetProps> = () => {
    const [sessionInterest, setSessionInterest] = React.useState(0.00000);

    // Live Interest Ticker (The Bleed)
    // Simulating ~81.36 INR/day = ~0.00094 INR/sec
    // Ticking every 100ms
    React.useEffect(() => {
        const dailyInterest = 81.36;
        const interestPerSecond = dailyInterest / 86400;
        const interval = setInterval(() => {
            setSessionInterest(prev => prev + (interestPerSecond * 0.1));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group">
            <style>{`
                @keyframes drip {
                    0% { transform: translateY(-5px); opacity: 0; }
                    40% { opacity: 1; }
                    80% { transform: translateY(5px); opacity: 0; }
                    100% { transform: translateY(5px); opacity: 0; }
                }
                .animate-drip {
                    animation: drip 2s infinite ease-in-out;
                }
            `}</style>

            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-3 items-center">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight">Active Liability</h3>
                        <p className="text-xs text-slate-500 font-medium">Debt Manager</p>
                    </div>
                </div>
                <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded text-xs font-bold shadow-sm shadow-rose-900/20">
                    7.4% APR
                </span>
            </div>

            {/* Principal */}
            <div className="mb-6 relative z-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Outstanding Principal</p>
                <h2 className="text-3xl font-black text-rose-400 tracking-tight text-shadow-sm">-₹4,01,283</h2>
            </div>

            {/* The Bleed - Compacted */}
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 mt-4 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/50"></div>

                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 text-rose-500">
                        <TrendingDown size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">The Bleed</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Interest Cost</span>
                </div>

                <div className="relative z-10 flex justify-between items-end mt-1">
                    <div className="flex items-center gap-2">
                        <div className="text-rose-500 animate-drip">
                            <Droplet size={16} fill="currentColor" />
                        </div>
                        <p className="text-xl font-bold text-white">₹81.36 <span className="text-sm font-normal text-slate-400">/ day</span></p>
                    </div>

                    <p className="text-[10px] text-rose-400 font-mono opacity-80 mb-1">
                        +{sessionInterest.toFixed(5)} since session
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 relative z-10">
                <AlertTriangle size={12} className="text-rose-500/70" />
                <span className="font-medium italic opacity-70">This debt reduces your real Net Worth.</span>
            </div>
        </div>
    );
};

export const Project5LWidget: React.FC = () => null;

// ==========================================
// 5. Exposure Chart (Asset Allocation Donut)
// ==========================================

export const ExposureChartWidget: React.FC<CommonWidgetProps & {
    allocationData: AggregatedData[];
    investments: Investment[];
    CustomTooltip: any;
    isPrivacyMode: boolean;
    formatCurrency: (val: number) => string;
    calculatePercentage: (a: number, b: number) => string;
}> = ({ allocationData, CustomTooltip }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <PieChart size={80} className="text-slate-400" />
            </div>
            <div className="flex justify-between items-center mb-0 relative z-10">
                <div>
                    <h3 className="text-sm font-bold text-slate-100">Asset Allocation</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diversification Check</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 border border-slate-700/50">
                    <PieChart size={16} />
                </div>
            </div>



            <div className="flex-1 w-full relative z-10 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                    <RechartsPie>
                        <Pie
                            data={allocationData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            cornerRadius={40}
                            paddingAngle={4}
                            stroke="none"
                        >
                            {allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    </RechartsPie>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ==========================================
// 6. Platform Chart (Horizontal Bar Chart)
// ==========================================

export const PlatformChartWidget: React.FC<CommonWidgetProps & {
    platformData: AggregatedData[];
    isDarkMode: boolean;
    isPrivacyMode: boolean;
    CustomTooltip: any;
}> = ({ platformData, CustomTooltip }) => {
    // Sort logic to match reference (Desc)
    const sortedData = useMemo(() => {
        return [...platformData].sort((a, b) => b.value - a.value);
    }, [platformData]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Layers size={80} className="text-indigo-400" />
            </div>
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-sm font-bold text-slate-100">Platform Diversification</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Concentration</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 border border-slate-700/50">
                    <Layers size={16} />
                </div>
            </div>

            <div className="flex-1 w-full min-h-[220px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#334155" opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Brief Footer */}
            <div className="mt-4 pt-4 border-t border-slate-800 relative z-10 flex justify-between items-center text-xs text-slate-500">
                <span>Top Concentration</span>
                <span className="font-bold text-white">
                    {sortedData.length > 0 ? `${sortedData[0].name} (${sortedData[0].percentage}%)` : 'None'}
                </span>
            </div>
        </div>
    );
};
