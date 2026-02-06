import React, { useMemo } from 'react';
import { Investment } from '../../types';
import { AlertCircle, CheckCircle2, RefreshCw, AlertTriangle, Trash2, Clock, Database, FileDigit } from 'lucide-react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { formatCurrency } from '../../utils/helpers';

interface DataHealthHubProps {
    onClose?: () => void;
}

const DataHealthHub: React.FC<DataHealthHubProps> = ({ onClose }) => {
    const { investments, deleteInvestment } = usePortfolio();

    // Health Checks
    const healthStatus = useMemo(() => {
        const issues: { type: 'ERROR' | 'WARNING', message: string, id?: string, action?: string }[] = [];
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - 30); // 30 days old

        // 1. Stale Prices
        const stale = investments.filter(inv => {
            if (!inv.lastUpdated) return true;
            // @ts-ignore
            return new Date(inv.lastUpdated) < staleDate;
        });
        if (stale.length > 0) {
            issues.push({
                type: 'WARNING',
                message: `${stale.length} assets haven't been updated in 30 days.`
            });
        }

        // 2. Zero Price/Value
        const zeroValue = investments.filter(inv => inv.currentValue === 0 && inv.investedAmount > 0);
        if (zeroValue.length > 0) {
            issues.push({
                type: 'ERROR',
                message: `${zeroValue.length} assets have 0 value but non-zero investment.`
            });
        }

        // 3. Duplicates (Simple Fuzzy Match on Name + Qty)
        // Group by Name+Qty
        const groups: Record<string, string[]> = {};
        investments.forEach(inv => {
            const qty = inv.quantity || 0;
            const key = `${inv.name}-${qty}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(inv.id!);
        });

        const duplicates: string[] = [];
        Object.entries(groups).forEach(([key, ids]) => {
            if (ids.length > 1) {
                issues.push({
                    type: 'WARNING',
                    message: `Possible duplicate: ${key.split('-')[0]} (x${ids.length})`
                });
            }
        });

        return { issues, staleCount: stale.length, zeroCount: zeroValue.length };
    }, [investments]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Database size={18} className="text-indigo-500" />
                    Data Health Monitor
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${healthStatus.issues.length === 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                        {healthStatus.issues.length === 0 ? 'Healthy' : `${healthStatus.issues.length} Issues`}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {healthStatus.issues.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">All systems operational.</p>
                        <p className="text-xs text-slate-400">Data integrity matches professional standards.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {healthStatus.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                                {issue.type === 'ERROR' ? (
                                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{issue.message}</p>
                                    <p className="text-xs text-slate-500">Suggested Action: Review {issue.type === 'ERROR' ? 'immediately' : 'when possible'}.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Records</p>
                        <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{investments.length}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Stale (&gt;30d)</p>
                        <p className={`text-lg font-mono font-bold ${healthStatus.staleCount > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {healthStatus.staleCount}
                        </p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Zero Value</p>
                        <p className={`text-lg font-mono font-bold ${healthStatus.zeroCount > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {healthStatus.zeroCount}
                        </p>
                    </div>
                </div>

                {/* Export Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => import('../../services/BackupService').then(m => m.handleDownloadBackup())}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <Database size={14} />
                        Backup JSON
                    </button>
                    <button
                        onClick={() => import('../../services/BackupService').then(m => m.handleExportHoldings())}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <FileDigit size={14} />
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataHealthHub;
