
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
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Layers size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Overlap Analysis</h3>
                                <p className="text-slate-500 max-w-md">
                                    Compare internal holdings of your Mutual Funds to identify portfolio redundancy.
                                    <br /><br />
                                    <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">COMING SOON</span>
                                </p>
                            </div>
                        )}

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
