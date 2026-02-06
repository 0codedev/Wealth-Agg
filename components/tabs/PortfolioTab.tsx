import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useToast } from '../shared/ToastProvider';
import {
    Wallet, Coins, Gauge, Plus, LayoutList, Table as TableIcon,
    RefreshCw, ArrowUpRight, Search, PieChart, Bot, Circle, Scale, X, Activity, ExternalLink, Minimize2, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AnalyticsView } from './portfolio/AnalyticsView';
import { HoldingsView } from './portfolio/HoldingsView';
import { RiskEngineView } from './portfolio/RiskEngineView';
import { PassiveIncomeView } from './portfolio/PassiveIncomeView';
import { PortfolioExportPanel } from '../portfolio/PortfolioExportPanel';
import { useMarketSentiment } from '../../hooks/useMarketSentiment';
import { Investment, ASSET_CLASS_COLORS } from '../../types';
import { Tabs } from '../ui/AnimatedTabs';
import { AnimatedToggle } from '../ui/AnimatedToggle';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { useFamily } from '../../contexts/FamilyContext';

// Lazy Loaded Modals for Performance
const AssetSimulatorModal = React.lazy(() => import('../AssetSimulatorModal'));
const XRayModal = React.lazy(() => import('./portfolio/XRayModal').then(module => ({ default: module.XRayModal })));
const RebalancingTool = React.lazy(() => import('../tools/RebalancingTool').then(module => ({ default: module.RebalancingTool })));

// Type-safe Portfolio Stats interface
interface PortfolioStats {
    totalInvested: number;
    totalCurrent: number;
    totalValue?: number;
    totalPL: number;
    totalPLPercent: number | string; // Can be string from toFixed()
    loanBalance?: number;
    investmentCount?: number;
    totalAssets?: number;
    diversityScore?: number;
    distributionData?: { name: string; value: number }[];
    [key: string]: any; // Allow additional properties from App.tsx
}

interface PortfolioTabProps {
    investments: Investment[];
    stats: PortfolioStats;
    onAddAsset: () => void;
    onEditAsset: (inv: Investment, e: React.MouseEvent) => void;
    onDeleteAsset: (inv: Investment, e: React.MouseEvent) => void;
    onQuickUpdate?: (id: string, invData: Partial<Investment>) => void;
    onRefreshRecurring?: () => void;
    formatCurrency: (val: number) => string;
    calculatePercentage: (part: number, total: number) => string;
    isPrivacyMode: boolean;
    PrivacyValue: React.FC<{ value: string | number, isPrivacyMode: boolean, className?: string }>;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
    investments, stats, onAddAsset, onEditAsset, onDeleteAsset, onQuickUpdate, onRefreshRecurring,
    formatCurrency, calculatePercentage, isPrivacyMode, PrivacyValue
}) => {
    const { toast } = useToast();
    const { status: marketStatus, vix: marketVix } = useMarketSentiment();
    const { activeEntity } = useFamily();

    const [activeTab, setActiveTab] = useState('HOLDINGS');
    const [simulatorAsset, setSimulatorAsset] = useState<Investment | null>(null);
    const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isXRayOpen, setIsXRayOpen] = useState(false);

    const [selectedForCompare, setSelectedForCompare] = useState<Investment[]>([]);

    // Undo Delete State
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

    // --- Hoisted State for Unified Toolbar ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');
    const [groupBy, setGroupBy] = useState<'NONE' | 'TYPE' | 'PLATFORM'>('NONE');
    const [viewMode, setViewMode] = useState<'CARD' | 'TERMINAL'>('CARD');
    const [isSpotlightEnabled, setIsSpotlightEnabled] = useState(true);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tab: string } | null>(null);

    // Filter Logic moved to App.tsx Global State
    // const filteredInvestments = ...
    // Filter Logic moved to App.tsx Global State
    // const filteredInvestments = ...
    // Optimistic Delete: Exclude pending deletes
    const filteredInvestments = useMemo(() =>
        investments.filter(inv => !pendingDeletes.has(inv.id)),
        [investments, pendingDeletes]);


    // Memoized handlers
    const handleAutoSip = useCallback(() => {
        if (!onQuickUpdate) return;
        let sipCount = 0;

        filteredInvestments.forEach(inv => {
            if (inv.recurring?.isEnabled && inv.recurring.amount > 0) {
                const newCurrent = inv.currentValue + inv.recurring.amount;
                const newInvested = inv.investedAmount + inv.recurring.amount;
                onQuickUpdate(inv.id, {
                    currentValue: newCurrent,
                    investedAmount: newInvested
                });
                sipCount++;
            }
        });

        if (sipCount > 0) toast.success(`Auto - SIP executed for ${sipCount} asset${sipCount > 1 ? 's' : ''} !`);
        else toast.info('No active SIPs found.');
    }, [filteredInvestments, onQuickUpdate, toast]);

    const downloadCSV = useCallback(() => {
        const headers = ["Name", "Type", "Platform", "Invested", "Current", "Last Updated", "Owner"];
        const rows = filteredInvestments.map(i => [i.name, i.type, i.platform, i.investedAmount, i.currentValue, i.lastUpdated, i.owner || 'Self']);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `wealth_aggregator_${activeEntity}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredInvestments, activeEntity]);

    // Context Menu Trigger
    const handleTabContextMenu = (e: React.MouseEvent, tab: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tab });
    };

    const contextMenuItems: ContextMenuItem[] = [
        {
            label: "Open in New Window",
            icon: <ExternalLink size={14} />,
            onClick: () => toast.info(`Opening ${contextMenu?.tab} in new window...`)
        },
        {
            label: "Focus Mode",
            icon: <Minimize2 size={14} />,
            onClick: () => toast.info("Focus mode enabled")
        },
        {
            label: "Pin Tab",
            icon: <Pin size={14} />,
            onClick: () => toast.success("Tab pinned to sidebar")
        }
    ];

    // Undo-capable Delete Handler
    const handleUndoableDelete = useCallback((inv: Investment, e: React.MouseEvent) => {
        e.stopPropagation();

        // 1. Optimistic Hide
        setPendingDeletes(prev => {
            const next = new Set(prev);
            next.add(inv.id);
            return next;
        });

        // 2. Show Undo Toast
        toast.success(`Deleted ${inv.name}`, {
            duration: 4000,
            action: {
                label: 'Undo',
                onClick: () => {
                    // Restore
                    setPendingDeletes(prev => {
                        const next = new Set(prev);
                        next.delete(inv.id);
                        return next;
                    });
                }
            }
        });

        // 3. Commit Delete after delay
        setTimeout(() => {
            setPendingDeletes(prev => {
                // If still pending (not undone), commit
                if (prev.has(inv.id)) {
                    onDeleteAsset(inv, e);
                    // Cleanup set
                    const next = new Set(prev);
                    next.delete(inv.id);
                    return next;
                }
                return prev;
            });
        }, 4500);
    }, [onDeleteAsset, toast]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0 font-sans">

            <Tabs.Root value={activeTab} onValueChange={setActiveTab} layoutId="portfolio-sub-nav">
                {/* Glassmorphic Unified Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-2 rounded-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all">

                    {/* 1. Animated Navigation Tabs */}
                    <Tabs.List>
                        <Tabs.Trigger value="HOLDINGS" icon={<Wallet size={14} />} onContextMenu={(e) => handleTabContextMenu(e, 'Holdings')}>Holdings</Tabs.Trigger>
                        <Tabs.Trigger value="ANALYTICS" icon={<PieChart size={14} />} onContextMenu={(e) => handleTabContextMenu(e, 'Analytics')}>Analytics</Tabs.Trigger>
                        <Tabs.Trigger value="KILL_SWITCH" icon={<Gauge size={14} />} onContextMenu={(e) => handleTabContextMenu(e, 'Kill Switch')}>Kill Switch</Tabs.Trigger>
                        <Tabs.Trigger value="PASSIVE_INCOME" icon={<Coins size={14} />} onContextMenu={(e) => handleTabContextMenu(e, 'Passive')}>Passive</Tabs.Trigger>
                    </Tabs.List>

                    {/* 2. Actions & Search (Only for Holdings) */}
                    {activeTab === 'HOLDINGS' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-none"
                        >
                            {/* Search Bar */}
                            <div className="relative group w-full md:w-auto md:max-w-xs transition-all duration-300">
                                <div className="flex items-center bg-slate-100/80 dark:bg-slate-900/60 rounded-xl px-3 py-2 border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all">
                                    <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search assets..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs font-medium text-slate-900 dark:text-white ml-2 w-full placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

                            {/* Controls Toolbar */}
                            <div className="flex items-center gap-2 ml-auto">

                                {/* Add Button with Pulse */}
                                <motion.button
                                    onClick={onAddAsset}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all group shrink-0 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <Plus size={16} strokeWidth={2.5} className="relative z-10" />
                                </motion.button>

                                {/* View Mode Toggle */}
                                <AnimatedToggle
                                    items={[
                                        { id: 'CARD', icon: <LayoutList /> },
                                        { id: 'TERMINAL', icon: <TableIcon /> }
                                    ]}
                                    activeId={viewMode}
                                    onChange={(id) => setViewMode(id as any)}
                                    layoutId="portfolioViewMode"
                                />

                                {/* Filter Toggle */}
                                <AnimatedToggle
                                    items={[
                                        { id: 'ALL', label: 'All' },
                                        { id: 'PROFIT', label: 'Gain' },
                                        { id: 'LOSS', label: 'Loss' }
                                    ]}
                                    activeId={filterType}
                                    onChange={(id) => setFilterType(id as any)}
                                    layoutId="portfolioFilter"
                                    size="sm"
                                />

                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                                {/* Group By Toggle */}
                                <AnimatedToggle
                                    items={[
                                        { id: 'NONE', label: 'List' },
                                        { id: 'TYPE', label: 'Type' },
                                        { id: 'PLATFORM', label: 'App' }
                                    ]}
                                    activeId={groupBy}
                                    onChange={(id) => setGroupBy(id as any)}
                                    layoutId="portfolioGroup"
                                    size="sm"
                                />

                                <button
                                    onClick={() => setIsSpotlightEnabled(!isSpotlightEnabled)}
                                    className={`p-1.5 rounded-lg transition-colors ${isSpotlightEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} `}
                                >
                                    <Circle size={16} fill={isSpotlightEnabled ? "currentColor" : "none"} />
                                </button>

                                {/* Utility Menu */}
                                <div className="flex gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                                    <button onClick={handleAutoSip} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><RefreshCw size={16} /></button>
                                    <button onClick={() => setIsRebalanceOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Bot size={16} /></button>
                                    <button onClick={() => setIsCompareOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Scale size={16} /></button>
                                    <button onClick={downloadCSV} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ArrowUpRight size={16} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ANALYTICS' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-1 items-center justify-end gap-2"
                        >
                            <button
                                onClick={() => setIsXRayOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all text-xs font-bold"
                            >
                                <Activity size={14} /> X-Ray
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Content Area with AnimatePresence */}
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {activeTab === 'HOLDINGS' && (
                                <HoldingsView
                                    investments={filteredInvestments}
                                    totalAssets={stats.totalAssets}
                                    onAddAsset={onAddAsset}
                                    onEditAsset={onEditAsset}
                                    onDeleteAsset={handleUndoableDelete}
                                    onQuickUpdate={onQuickUpdate}
                                    formatCurrency={formatCurrency}
                                    calculatePercentage={calculatePercentage}
                                    isPrivacyMode={isPrivacyMode}
                                    PrivacyValue={PrivacyValue}
                                    setSimulatorAsset={setSimulatorAsset}
                                    searchTerm={searchTerm}
                                    filterType={filterType}
                                    groupBy={groupBy}
                                    viewMode={viewMode}
                                    isSpotlightEnabled={isSpotlightEnabled}
                                />
                            )}

                            {activeTab === 'ANALYTICS' && (
                                <>
                                    <AnalyticsView
                                        investments={filteredInvestments}
                                        formatCurrency={formatCurrency}
                                        isPrivacyMode={isPrivacyMode}
                                    />
                                    <div className="mt-6">
                                        <PortfolioExportPanel investments={filteredInvestments} />
                                    </div>
                                </>
                            )}

                            {activeTab === 'KILL_SWITCH' && (
                                <RiskEngineView
                                    investments={filteredInvestments}
                                    totalAssets={filteredInvestments.reduce((acc, i) => acc + i.currentValue, 0)}
                                    formatCurrency={formatCurrency}
                                    setSimulatorAsset={setSimulatorAsset}
                                />
                            )}

                            {activeTab === 'PASSIVE_INCOME' && (
                                <PassiveIncomeView
                                    investments={filteredInvestments}
                                    totalAssets={stats.totalAssets}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Tabs.Root>

            {/* Context Menu Portal */}
            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={contextMenuItems}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </AnimatePresence>

            {/* Modals with Suspense */}
            <Suspense fallback={null}>
                {simulatorAsset && (
                    <AssetSimulatorModal
                        investment={simulatorAsset}
                        onClose={() => setSimulatorAsset(null)}
                    />
                )}

                {isXRayOpen && (
                    <XRayModal
                        investments={filteredInvestments}
                        totalAssets={stats?.totalAssets || 0}
                        onClose={() => setIsXRayOpen(false)}
                        formatCurrency={formatCurrency}
                        isPrivacyMode={isPrivacyMode}
                        setSimulatorAsset={setSimulatorAsset}
                    />
                )}

                {isRebalanceOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsRebalanceOpen(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 p-6" onClick={e => e.stopPropagation()}>
                            <RebalancingTool
                                allocationData={stats?.distributionData || []}
                                totalValue={stats?.totalAssets || 0}
                                formatCurrency={formatCurrency}
                                onClose={() => setIsRebalanceOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </Suspense>

            {/* Asset Comparison Modal */}
            {isCompareOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCompareOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Scale className="text-emerald-500" size={24} /> Compare Assets
                            </h2>
                            <button onClick={() => setIsCompareOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">Select up to 3 assets to compare side-by-side</p>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[0, 1, 2].map(idx => (
                                    <select
                                        key={idx}
                                        value={selectedForCompare[idx]?.id || ''}
                                        onChange={(e) => {
                                            const asset = investments.find(i => i.id === e.target.value);
                                            const newSelected = [...selectedForCompare];
                                            if (asset) newSelected[idx] = asset;
                                            else newSelected.splice(idx, 1);
                                            setSelectedForCompare(newSelected.filter(Boolean));
                                        }}
                                        className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Asset {idx + 1}</option>
                                        {filteredInvestments.map(inv => (
                                            <option key={inv.id} value={inv.id} disabled={selectedForCompare.some(s => s.id === inv.id)}>
                                                {inv.name}
                                            </option>
                                        ))}
                                    </select>
                                ))}
                            </div>

                            {/* Comparison Table */}
                            {selectedForCompare.length >= 2 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase">Metric</th>
                                                {(selectedForCompare || []).map(asset => (
                                                    <th key={asset.id} className="text-center p-3 text-sm font-bold text-slate-900 dark:text-white">{asset.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="p-3 text-sm text-slate-500">Invested</td>
                                                {(selectedForCompare || []).map(asset => (
                                                    <td key={asset.id} className="text-center p-3 font-mono text-slate-900 dark:text-white">{formatCurrency(asset.investedAmount)}</td>
                                                ))}
                                            </tr>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="p-3 text-sm text-slate-500">Current Value</td>
                                                {(selectedForCompare || []).map(asset => (
                                                    <td key={asset.id} className="text-center p-3 font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(asset.currentValue)}</td>
                                                ))}
                                            </tr>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="p-3 text-sm text-slate-500">P/L</td>
                                                {(selectedForCompare || []).map(asset => {
                                                    const pl = asset.currentValue - asset.investedAmount;
                                                    return (
                                                        <td key={asset.id} className={`text-center p-3 font-mono font-bold ${pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {selectedForCompare.length < 2 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Scale size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>Select at least 2 assets to compare</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(PortfolioTab);
