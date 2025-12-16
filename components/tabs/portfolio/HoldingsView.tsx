
import React, { useState, useMemo, useEffect } from 'react';
import {
    Wallet, ChevronDown, ChevronRight, TrendingUp, Zap, Sparkles,
    LayoutDashboard, Edit2, Trash2, AlertTriangle, ArrowUpRight,
    Keyboard, RefreshCw
} from 'lucide-react';
import { Investment, InvestmentType } from '../../../types';
import { RiskEngine } from '../../../services/RiskEngine';
import { useSettingsStore } from '../../../store/settingsStore';
import Sparkline from '../../Sparkline';

interface HoldingsViewProps {
    investments: Investment[];
    totalAssets: number;
    onAddAsset: () => void;
    onEditAsset: (inv: Investment, e: React.MouseEvent) => void;
    onDeleteAsset: (inv: Investment, e: React.MouseEvent) => void;
    onQuickUpdate?: (id: string, invData: Partial<Investment>) => void;
    onRefreshRecurring?: () => void; // Kept in interface but unused here now
    downloadCSV?: () => void; // Kept in interface but unused here now
    formatCurrency: (val: number) => string;
    calculatePercentage: (part: number, total: number) => string;
    isPrivacyMode: boolean;
    PrivacyValue: React.FC<{ value: string | number, isPrivacyMode: boolean, className?: string }>;
    setSimulatorAsset: (inv: Investment | null) => void;

    // Props passed from Parent
    searchTerm: string;
    filterType: 'ALL' | 'PROFIT' | 'LOSS';
    groupBy: 'NONE' | 'TYPE' | 'PLATFORM';
    viewMode: 'CARD' | 'TERMINAL';
    isSpotlightEnabled?: boolean;
}

interface GroupedData {
    totalInv: number;
    totalCurr: number;
    items: Investment[];
}

export const HoldingsView: React.FC<HoldingsViewProps> = ({
    investments, totalAssets, onEditAsset, onDeleteAsset, onQuickUpdate,
    formatCurrency, calculatePercentage, isPrivacyMode,
    PrivacyValue, setSimulatorAsset,
    searchTerm, filterType, groupBy, viewMode, isSpotlightEnabled = true
}) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
    const [editingCell, setEditingCell] = useState<{ id: string, field: 'investedAmount' | 'currentValue' } | null>(null);
    const [editValue, setEditValue] = useState('');

    const { bullionCap, greedKillerRoi } = useSettingsStore();

    const riskEngine = useMemo(() => new RiskEngine({
        bullionCap,
        profitThreshold: greedKillerRoi
    }), [bullionCap, greedKillerRoi]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const filteredInvestments = useMemo(() => {
        return investments.filter(inv => {
            const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.platform.toLowerCase().includes(searchTerm.toLowerCase());
            const profit = inv.currentValue - inv.investedAmount;
            const matchesFilter = filterType === 'ALL' ? true :
                filterType === 'PROFIT' ? profit >= 0 : profit < 0;
            return matchesSearch && matchesFilter;
        });
    }, [investments, searchTerm, filterType]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Investment | 'profit'; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: keyof Investment | 'profit') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedInvestments = useMemo(() => {
        let sortableItems = [...filteredInvestments];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Investment];
                let bValue: any = b[sortConfig.key as keyof Investment];

                // Special handling for Profit
                if (sortConfig.key === 'profit') {
                    aValue = a.currentValue - a.investedAmount;
                    bValue = b.currentValue - b.investedAmount;
                }

                // Handle strings (case-insensitive)
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                // Handle numbers
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredInvestments, sortConfig]);

    const groupedInvestments = useMemo(() => {
        if (groupBy === 'NONE') return null;
        const groups: Record<string, GroupedData> = {};
        sortedInvestments.forEach(inv => {
            const key = groupBy === 'TYPE' ? inv.type : inv.platform;
            if (!groups[key]) groups[key] = { totalInv: 0, totalCurr: 0, items: [] };
            groups[key].items.push(inv);
            groups[key].totalInv += inv.investedAmount;
            groups[key].totalCurr += inv.currentValue;
        });
        return groups;
    }, [sortedInvestments, groupBy]);

    // Keyboard Nav
    useEffect(() => {
        if (viewMode !== 'TERMINAL' || editingCell) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedRowIndex(prev => Math.min(prev + 1, sortedInvestments.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedRowIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedRowIndex >= 0 && sortedInvestments[selectedRowIndex]) {
                    setSimulatorAsset(sortedInvestments[selectedRowIndex]);
                }
            } else if (e.key === '2') {
                // Shortcut to edit Current Value
                e.preventDefault();
                if (selectedRowIndex >= 0 && sortedInvestments[selectedRowIndex]) {
                    const inv = sortedInvestments[selectedRowIndex];
                    startEditing(inv.id, 'currentValue', inv.currentValue);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, sortedInvestments, selectedRowIndex, editingCell]);

    const startEditing = (id: string, field: 'investedAmount' | 'currentValue', currentValue: number) => {
        if (isPrivacyMode) return;
        setEditingCell({ id, field });
        setEditValue(currentValue.toString());
    };

    const saveInlineEdit = () => {
        if (editingCell && onQuickUpdate) {
            const numVal = parseFloat(editValue);
            if (!isNaN(numVal)) {
                onQuickUpdate(editingCell.id, { [editingCell.field]: numVal });
            }
        }
        setEditingCell(null);
    };

    const renderTerminalRow = (inv: Investment, index: number) => {
        const profit = inv.currentValue - inv.investedAmount;
        const profitPercent = calculatePercentage(profit, inv.investedAmount);
        const isProfit = profit >= 0;
        const portfolioShare = calculatePercentage(inv.currentValue, totalAssets);
        const isSelected = index === selectedRowIndex;
        const isEditingInvested = editingCell?.id === inv.id && editingCell?.field === 'investedAmount';
        const isEditingCurrent = editingCell?.id === inv.id && editingCell?.field === 'currentValue';

        return (
            <tr
                key={inv.id}
                className={`group border-b border-slate-100 dark:border-slate-800 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                onClick={() => setSelectedRowIndex(index)}
            >
                <td className="py-3 px-4 relative cursor-pointer" onClick={() => setSimulatorAsset(inv)}>
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isProfit ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                            {inv.type === InvestmentType.STOCKS ? <TrendingUp size={14} /> : inv.type === InvestmentType.CRYPTO ? <Zap size={14} /> : <Wallet size={14} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{inv.type}</p>
                        </div>
                    </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{inv.platform}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400 cursor-cell hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => startEditing(inv.id, 'investedAmount', inv.investedAmount)}>
                    {isEditingInvested ? <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveInlineEdit} autoFocus className="w-24 bg-white dark:bg-slate-950 border border-indigo-500 rounded px-1 py-0.5 text-right outline-none" /> : <PrivacyValue value={inv.investedAmount} isPrivacyMode={isPrivacyMode} />}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-bold text-slate-900 dark:text-white cursor-cell hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => startEditing(inv.id, 'currentValue', inv.currentValue)}>
                    {isEditingCurrent ? <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveInlineEdit} autoFocus className="w-24 bg-white dark:bg-slate-950 border border-indigo-500 rounded px-1 py-0.5 text-right outline-none" /> : <PrivacyValue value={inv.currentValue} isPrivacyMode={isPrivacyMode} />}
                </td>
                <td className="py-3 px-4 text-right">
                    <div className={`font-mono text-sm font-bold ${isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{isProfit ? '+' : ''}{profitPercent}%</div>
                    <div className={`text-[10px] ${isProfit ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70'}`}>{isProfit ? '+' : ''}{formatCurrency(profit)}</div>
                </td>
                <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                        <Sparkline trend={isProfit ? 'UP' : 'DOWN'} width={60} height={20} />
                    </div>
                </td>
                <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-medium text-slate-500">{portfolioShare}%</span>
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.max(0, Number(portfolioShare))}%` }}></div></div>
                    </div>
                </td>
                <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEditAsset(inv, e); }} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded text-slate-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteAsset(inv, e); }} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                </td>
            </tr>
        );
    };

    const renderCardItem = (inv: Investment) => {
        const profit = inv.currentValue - inv.investedAmount;
        const profitPercent = calculatePercentage(profit, inv.investedAmount);
        const isProfit = profit >= 0;
        const { shouldBookProfit, isBubbleRisk } = riskEngine.analyzeAsset(inv);

        let Icon = Wallet;
        if (inv.type === InvestmentType.STOCKS) Icon = TrendingUp;
        else if (inv.type === InvestmentType.CRYPTO) Icon = Zap;
        else if (inv.type === InvestmentType.DIGITAL_GOLD || inv.type === InvestmentType.DIGITAL_SILVER) Icon = Sparkles;
        else if (inv.type === InvestmentType.REAL_ESTATE) Icon = LayoutDashboard;

        return (
            <div
                key={inv.id}
                onClick={() => setSimulatorAsset(inv)}
                className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 group relative overflow-hidden cursor-pointer ${isSpotlightEnabled ? 'hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-200 dark:hover:border-indigo-500/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}><Icon size={20} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[140px] flex items-center gap-1">{inv.name}{isBubbleRisk && <AlertTriangle size={12} className="text-fuchsia-500" />}</h4>
                            <p className="text-xs text-slate-500">{inv.platform}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white text-base"><PrivacyValue value={inv.currentValue} isPrivacyMode={isPrivacyMode} /></p>
                        <p className={`text-xs font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>{isProfit ? '+' : ''}{profitPercent}%</p>
                    </div>
                </div>

                {/* Sparkline Overlay */}
                {isSpotlightEnabled && (
                    <div className="absolute bottom-12 left-0 right-0 h-8 opacity-10 pointer-events-none">
                        <Sparkline trend={isProfit ? 'UP' : 'DOWN'} width={300} height={32} />
                    </div>
                )}

                {shouldBookProfit && (<div className="mb-3"><button className="w-full flex items-center justify-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"><ArrowUpRight size={12} /> TAKE PROFIT SIGNAL</button></div>)}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 relative z-10">
                    <div className="flex items-center gap-2">{inv.recurring?.isEnabled && <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1"><RefreshCw size={10} /> SIP</span>}<span className="text-[10px] text-slate-400 font-mono">{calculatePercentage(inv.currentValue, totalAssets)}% of Port.</span></div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEditAsset(inv, e); }} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded text-slate-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteAsset(inv, e); }} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                </div>
            </div>
        );
    };

    const TableHeader = () => (
        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <tr>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Asset</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Platform</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Invested</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Current</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">P&L</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center">Trend</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Allocation</th>
                <th className="py-3 px-4"></th>
            </tr>
        </thead>
    );

    return (
        <div className="space-y-4">
            {viewMode === 'TERMINAL' && (
                <div className="flex items-center gap-4 text-xs text-slate-500 px-2 mb-2 animate-in fade-in">
                    <div className="flex items-center gap-1"><span className="p-1 bg-slate-200 dark:bg-slate-800 rounded"><Keyboard size={12} /></span> <span>Navigate</span></div>
                    <div className="flex items-center gap-1"><span className="p-1 bg-slate-200 dark:bg-slate-800 rounded">Enter</span> <span>Simulate</span></div>
                    <div className="flex items-center gap-1"><span className="p-1 bg-slate-200 dark:bg-slate-800 rounded">2</span> <span>Edit Value</span></div>
                </div>
            )}

            {investments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 mb-4"><Wallet size={40} /></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Your portfolio is empty.</p>
                </div>
            ) : filteredInvestments.length === 0 ? (
                <div className="text-center py-20"><p className="text-slate-500 dark:text-slate-400">No assets match your search.</p></div>
            ) : groupBy === 'NONE' ? (
                viewMode === 'TERMINAL' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <TableHeader />
                            <tbody>{sortedInvestments.map((inv, index) => renderTerminalRow(inv, index))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">{filteredInvestments.map(inv => renderCardItem(inv))}</div>
                )
            ) : (
                groupedInvestments && Object.entries(groupedInvestments).map(([groupKey, groupData]: [string, GroupedData]) => (
                    <div key={groupKey} className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-md">
                        <div
                            className="p-4 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-sm flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors select-none"
                            onClick={() => toggleGroup(groupKey)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-transform duration-200 ${expandedGroups[groupKey] ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rotate-90' : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                    <ChevronRight size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight">{groupKey}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{groupData.items.length} assets • {formatCurrency(groupData.totalCurr)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-mono font-bold ${(groupData.totalCurr - groupData.totalInv) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {(groupData.totalCurr - groupData.totalInv) >= 0 ? '+' : ''}{calculatePercentage(groupData.totalCurr - groupData.totalInv, groupData.totalInv)}%
                                </div>
                            </div>
                        </div>

                        {expandedGroups[groupKey] && (
                            <div className="p-4 bg-slate-100/50 dark:bg-black/20 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-1 duration-200">
                                {viewMode === 'TERMINAL' ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <TableHeader />
                                            <tbody>{groupData.items.map((inv, idx) => renderTerminalRow(inv, idx))}</tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                                        {groupData.items.map(inv => renderCardItem(inv))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
