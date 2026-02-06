
import React, { useState } from 'react';
import { X, Activity, PieChart, Layers, Flame, LayoutGrid } from 'lucide-react';
import { Investment } from '../../../types';
import { AnalyticsView } from './AnalyticsView';
import { RiskEngineView } from './RiskEngineView';
import { HealthScoreCard } from '../../shared/PortfolioTools';

interface XRayModalProps {
    investments: Investment[];
    totalAssets: number;
    onClose: () => void;
    formatCurrency: (val: number) => string;
    isPrivacyMode: boolean;
    setSimulatorAsset: (inv: Investment | null) => void;
}

type Tab = 'HEALTH' | 'SECTOR' | 'OVERLAP' | 'RISK';

export const XRayModal: React.FC<XRayModalProps> = ({
    investments, totalAssets, onClose, formatCurrency, isPrivacyMode, setSimulatorAsset
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('HEALTH');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 w-full max-w-[90vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">

                {/* Header - Optimized with Parallel Tabs */}
                <div className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Portfolio X-Ray</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Deep Dive Analysis</p>
                            </div>
                        </div>

                        {/* Parallel Tabs */}
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('HEALTH')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'HEALTH'
                                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <HeartIcon active={activeTab === 'HEALTH'} /> Health
                            </button>
                            <button
                                onClick={() => setActiveTab('SECTOR')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'SECTOR'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <PieChart size={14} /> Sector
                            </button>
                            <button
                                onClick={() => setActiveTab('OVERLAP')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'OVERLAP'
                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Layers size={14} /> Overlap
                            </button>
                            <button
                                onClick={() => setActiveTab('RISK')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'RISK'
                                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Flame size={14} /> Risk
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 bg-slate-100 dark:bg-slate-950/50">
                    <div className="max-w-7xl mx-auto">

                        {activeTab === 'HEALTH' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl mb-6">
                                    <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">Portfolio Health Check</h3>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                        Analyzing {investments.length} assets based on diversification, expense ratios, consistency, and risk-adjusted returns.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {investments.map(inv => (
                                        <HealthScoreCard key={inv.id} investment={inv} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'SECTOR' && (
                            <AnalyticsView
                                investments={investments}
                                formatCurrency={formatCurrency}
                                isPrivacyMode={isPrivacyMode}
                            />
                        )}

                        {activeTab === 'RISK' && (
                            <RiskEngineView
                                investments={investments}
                                totalAssets={totalAssets}
                                formatCurrency={formatCurrency}
                                setSimulatorAsset={setSimulatorAsset}
                            />
                        )}

                        {activeTab === 'OVERLAP' && (
                            <OverlapAnalysisView
                                investments={investments}
                                formatCurrency={formatCurrency}
                            />
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component for Overlap Analysis ---
const OverlapAnalysisView: React.FC<{
    investments: Investment[];
    formatCurrency: (val: number) => string;
}> = ({ investments, formatCurrency }) => {
    const [data, setData] = useState<{
        direct: Map<string, number>;
        indirect: Map<string, number>;
        total: Map<string, number>;
        metadata: Map<string, { name: string, sector: string }>;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const analyze = async () => {
            setLoading(true);
            const { directExposure, indirectExposure, totalExposure, stockMetadata } = await import('../../../services/FundLookthroughService')
                .then(m => m.fundLookthroughService.analyzePortfolio(investments));

            setData({
                direct: directExposure,
                indirect: indirectExposure,
                total: totalExposure,
                metadata: stockMetadata
            });
            setLoading(false);
        };
        analyze();
    }, [investments]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <LayoutGrid className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold animate-pulse">Scanning fund documents (AI Lookthrough)...</p>
        </div>
    );

    if (!data || data.total.size === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Layers size={32} className="mb-4 opacity-50" />
            <p>No significant overlap data found.</p>
        </div>
    );

    // Sort by Total Value
    const sortedStocks = Array.from(data.total.entries())
        .map(([ticker, val]) => ({
            ticker,
            val,
            direct: data.direct.get(ticker) || 0,
            indirect: data.indirect.get(ticker) || 0,
            meta: data.metadata.get(ticker)
        }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10); // Top 10

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Stacked Bar Chart (Composition) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-indigo-500" /> True Exposure X-Ray (Top 10)
                    </h3>
                    <div className="space-y-5">
                        {sortedStocks.map((stock) => {
                            const totalPercent = (stock.val / Math.max(...sortedStocks.map(s => s.val))) * 100;
                            const directPercent = (stock.direct / stock.val) * 100;
                            const indirectPercent = (stock.indirect / stock.val) * 100;

                            return (
                                <div key={stock.ticker} className="group">
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{stock.ticker}</span>
                                            <span className="text-slate-700 dark:text-slate-200">{stock.meta?.name}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-slate-400">{formatCurrency(stock.val)}</span>
                                        </div>
                                    </div>

                                    {/* The Stacked Bar */}
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                                        {/* Direct Portion */}
                                        {stock.direct > 0 && (
                                            <div
                                                className="bg-indigo-500 group-hover:bg-indigo-400 transition-colors relative"
                                                style={{ width: `${(stock.direct / stock.val) * 100}%` }}
                                            >
                                                {/* Tooltip trigger area could go here */}
                                            </div>
                                        )}
                                        {/* Indirect Portion */}
                                        {stock.indirect > 0 && (
                                            <div
                                                className="bg-purple-400/70 group-hover:bg-purple-400 transition-colors relative"
                                                style={{ width: `${(stock.indirect / stock.val) * 100}%` }}
                                            >
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className={stock.direct > 0 ? "text-indigo-500" : ""}>
                                            Direct: {formatCurrency(stock.direct)}
                                        </span>
                                        <span className={stock.indirect > 0 ? "text-purple-500" : ""}>
                                            Indirect: {formatCurrency(stock.indirect)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Insight Card */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <h4 className="font-bold text-lg mb-2">Hidden Concentration</h4>
                        <p className="text-xs text-indigo-100 opacity-90 leading-relaxed mb-4">
                            You effectively own <span className="font-bold text-white bg-white/20 px-1 rounded">{formatCurrency(sortedStocks[0]?.val || 0)}</span> of
                            Analysis reveals that {(sortedStocks[0]?.indirect / sortedStocks[0]?.val * 100).toFixed(0)}% of your exposure to {sortedStocks[0]?.ticker} is hidden inside Mutual Funds.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-black/20 p-2 rounded-lg">
                            <Layers size={12} /> Unbundled View
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Legend</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Direct Ownership</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-400/70"></div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Via Mutual Funds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeartIcon = ({ active }: { active: boolean }) => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);
