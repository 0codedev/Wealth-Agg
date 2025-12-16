import React from 'react';
import {
    TrendingUp, TrendingDown, Target, Trophy, Flame, Crosshair, Wallet, PieChart, BarChart3, X,
    CreditCard, Users, ArrowRight
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { CHART_COLORS } from '../../types';
import LoanWidget from '../LoanWidget';
import { SortableWidget } from './SortableWidget';

// Types for Props
interface BaseWidgetProps {
    id: string;
    dragHandle?: boolean;
    className?: string;
    onRemove?: () => void;
}

interface TotalPLWidgetProps extends BaseWidgetProps {
    stats: any;
    isPrivacyMode: boolean;
    formatCurrency: (val: number) => string;
    formatCurrencyPrecise: (val: number) => string;
}

export const TotalPLWidget: React.FC<TotalPLWidgetProps> = ({ id, dragHandle, stats, isPrivacyMode, formatCurrency, formatCurrencyPrecise }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div className="flex flex-col justify-between h-full p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        {stats.totalPL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} Total P/L
                    </p>
                    <h3 className={`text-2xl font-bold mt-1 ${stats.totalPL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {stats.totalPL >= 0 ? '+' : ''}{isPrivacyMode ? '••••••' : formatCurrency(stats.totalPL)}
                    </h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${stats.totalPL >= 0 ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
                    {stats.totalPL >= 0 ? '+' : ''}{stats.totalPLPercent}%
                </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden flex">
                <div className="h-full bg-slate-400 dark:bg-slate-600" style={{ width: '70%' }} title="Principal"></div>
                <div className={`h-full ${stats.totalPL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '30%' }} title="P/L"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>INV: {formatCurrencyPrecise(stats.totalInvested)}</span>
                <span>CUR: {formatCurrencyPrecise(stats.totalAssets)}</span>
            </div>
        </div>
    </SortableWidget>
);

interface TopPerformerWidgetProps extends BaseWidgetProps {
    stats: any;
    calculatePercentage: (part: number, total: number) => string;
}

export const TopPerformerWidget: React.FC<TopPerformerWidgetProps> = ({ id, dragHandle, stats, calculatePercentage }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div className="flex flex-col justify-between h-full p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy size={80} className="text-amber-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2 mb-2">
                    <Target size={14} className="text-amber-500" /> Top Performer
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {stats.topAsset.name}
                </h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">All-Time Return</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        +{stats.topAsset.percent.toFixed(1)}%
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400">Impact</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {calculatePercentage(stats.topAsset.value, stats.totalAssets)}% of Port.
                    </p>
                </div>
            </div>
        </div>
    </SortableWidget>
);

export const LoanWidgetWrapper: React.FC<BaseWidgetProps> = ({ id, dragHandle }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div className="h-full rounded-2xl overflow-hidden p-0">
            <LoanWidget />
        </div>
    </SortableWidget>
);

interface Project5LWidgetProps extends BaseWidgetProps {
    stats: any;
    targetNetWorth: number;
    targetDate: string;
    progress5L: number;
    countdown: { days: number; hours: number; isExpired: boolean };
    isGrindMode: boolean;
    formatCurrency: (val: number) => string;
}

export const Project5LWidget: React.FC<Project5LWidgetProps> = ({
    id, dragHandle, stats, targetNetWorth, targetDate, progress5L, countdown, isGrindMode, formatCurrency
}) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div className="p-5 flex flex-col justify-between h-full min-h-[16rem] relative">
            {isGrindMode && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-1">
                    <Flame size={10} /> GRIND MODE
                </div>
            )}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-cyan-100 dark:bg-cyan-500/20 rounded text-cyan-600 dark:text-cyan-400">
                            <Crosshair size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">PROJECT 5L</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{progress5L}%</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Target: {formatCurrency(targetNetWorth)}
                </h4>
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <TrendingUp size={10} className="text-emerald-500" /> Profit
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${stats.totalPL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {stats.totalPL >= 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ease-out ${stats.totalPL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.max(0, (stats.totalPL / targetNetWorth) * 100))}%` }}></div>
                    </div>
                </div>
                <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Wallet size={10} className="text-indigo-500" /> Total Corpus
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(stats.totalAssets)}
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ease-out bg-indigo-500`} style={{ width: `${progress5L}%` }}></div>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">Tracking Total Assets (ignoring debt).</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Deadline: {targetDate.slice(0, 4)}</span>
                <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-500">Time Left</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {countdown.isExpired ? 'EXPIRED' : `${countdown.days}d ${countdown.hours}h`}
                    </p>
                </div>
            </div>
        </div>
    </SortableWidget>
);

interface ExposureChartWidgetProps extends BaseWidgetProps {
    allocationData: any[];
    investments: any[];
    CustomTooltip: any;
    isPrivacyMode: boolean;
    formatCurrency: (val: number) => string;
    calculatePercentage: (part: number, total: number) => string;
}

export const ExposureChartWidget: React.FC<ExposureChartWidgetProps> = ({
    id, dragHandle, allocationData, investments, CustomTooltip, isPrivacyMode, formatCurrency, calculatePercentage
}) => {
    const [selectedAssetType, setSelectedAssetType] = React.useState<string | null>(null);

    return (
        <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
            <div className="p-6 flex flex-col h-full relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Exposure by Asset Type</h3>
                    <PieChart size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-h-[14rem] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {/* @ts-ignore - Recharts type definition issue with nameKey */}
                        <RechartsPie
                            data={allocationData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={80}
                            paddingAngle={2}
                            cornerRadius={4}
                            stroke="none"
                            labelLine={false}
                            onClick={(data: any) => data && setSelectedAssetType(data.name)}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                if (percent < 0.05) return null;
                                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                            }}
                        >
                            {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />)}
                        </RechartsPie>
                        <Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} cursor={false} />
                    </ResponsiveContainer>
                </div>
                {selectedAssetType && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>{selectedAssetType}
                            </h4>
                            <button onClick={() => setSelectedAssetType(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {investments.filter(i => i.type === selectedAssetType).map(inv => (
                                <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{inv.name}</p>
                                        <p className="text-xs text-slate-500">{inv.platform}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-sm">{isPrivacyMode ? '••••••' : formatCurrency(inv.currentValue)}</p>
                                        <p className={`text-xs font-bold ${inv.currentValue >= inv.investedAmount ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {inv.currentValue >= inv.investedAmount ? '+' : ''}{calculatePercentage(inv.currentValue - inv.investedAmount, inv.investedAmount)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SortableWidget>
    );
};

interface PlatformChartWidgetProps extends BaseWidgetProps {
    platformData: any[];
    isDarkMode: boolean;
    isPrivacyMode: boolean;
    CustomTooltip: any;
}

export const PlatformChartWidget: React.FC<PlatformChartWidgetProps> = ({
    id, dragHandle, platformData, isDarkMode, isPrivacyMode, CustomTooltip
}) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Platform Diversification</h3>
                <BarChart3 size={18} className="text-slate-400" />
            </div>
            <div className="flex-1 min-h-[14rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[...platformData].sort((a, b) => b.value - a.value)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} stroke="none" />
                        <Tooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }} content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} />
                        <Bar dataKey="value" name="Current Value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </SortableWidget>
);

interface FeatureWidgetProps extends BaseWidgetProps {
    onClick: () => void;
}

export const SpendingWidget: React.FC<FeatureWidgetProps> = ({ id, dragHandle, onClick }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div
            onClick={onClick}
            className="group h-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <CreditCard size={24} />
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Spending & Optimization</h3>
                <p className="text-sm text-slate-500 mb-2">Track expenses, manage budgets & parsing.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded w-fit">
                <TrendingUp size={12} /> Optimization Active
            </div>
        </div>
    </SortableWidget>
);

export const MarketWidget: React.FC<FeatureWidgetProps> = ({ id, dragHandle, onClick }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div
            onClick={onClick}
            className="group h-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-cyan-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Market Insights</h3>
                <p className="text-sm text-slate-500 mb-2">News sentiment & peer benchmarking.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                Updated 2h ago
            </div>
        </div>
    </SortableWidget>
);

export const CommunityWidget: React.FC<FeatureWidgetProps> = ({ id, dragHandle, onClick }) => (
    <SortableWidget id={id} dragHandle={dragHandle} className="md:col-span-2 h-full">
        <div
            onClick={onClick}
            className="group h-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Community & Rewards</h3>
                <p className="text-sm text-slate-500 mb-2">Investment clubs & achievements.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-500 bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded w-fit">
                3 Active Challenges
            </div>
        </div>
    </SortableWidget>
);
