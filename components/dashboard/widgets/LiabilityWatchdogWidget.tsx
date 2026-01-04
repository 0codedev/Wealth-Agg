import React, { useMemo } from 'react';
import { useTransactions } from '../../../contexts/TransactionContext';
import { findSubscriptionTraps } from '../../../utils/liabilityDetector';
import { AlertOctagon, RefreshCw, XCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

export const LiabilityWatchdogWidget: React.FC = () => {
    const { transactions } = useTransactions();

    const traps = useMemo(() => {
        if (!transactions.length) return [];
        return findSubscriptionTraps(transactions);
    }, [transactions]);

    const totalYearlyDrag = traps.reduce((sum, t) => sum + t.yearlyImpact, 0);

    if (traps.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                    <RefreshCw size={24} />
                </div>
                <h3 className="text-slate-300 font-bold">No Traps Detected</h3>
                <p className="text-xs text-slate-500 max-w-[200px]">
                    Your cash flow looks clean. No hidden subscriptions found.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertOctagon size={14} /> Liability Watchdog
                    </h3>
                    <p className="text-2xl font-black text-white mt-1">
                        {formatCurrency(totalYearlyDrag)}
                        <span className="text-xs font-bold text-slate-500 ml-1">/YR DRAG</span>
                    </p>
                </div>
                <div className="px-2 py-1 bg-rose-500/10 rounded text-rose-500 text-xs font-bold animate-pulse">
                    {traps.length} ALERTS
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {traps.map((trap, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-rose-500/10 group hover:border-rose-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                {trap.merchant.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-200 capitalize">{trap.merchant}</p>
                                <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                                    <RefreshCw size={10} /> {trap.frequency}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold text-rose-400">{formatCurrency(trap.amount)}</p>
                            <p className="text-[10px] text-slate-500">{trap.riskLevel} Risk</p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-4 text-[10px] text-slate-500 text-center uppercase font-bold tracking-wider">
                Kill these to save {formatCurrency(totalYearlyDrag)}/yr
            </p>
        </div>
    );
};
