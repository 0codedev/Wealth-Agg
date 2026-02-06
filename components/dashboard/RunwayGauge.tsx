import React, { useMemo } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { db } from '../../database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Skull, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export const RunwayGauge: React.FC = () => {
    // 1. Get Monthly Burn (Avg of last 3 months)
    const { transactions } = useTransactions();

    const monthlyBurn = useMemo(() => {
        if (!transactions.length) return 0;
        const expenses = transactions.filter(t => t.type === 'debit' && !t.excluded);
        if (!expenses.length) return 0;
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        return totalExpense / 3; // Simplified for demo visual matching
    }, [transactions]);

    // 2. Get Liquid Assets
    const investments = useLiveQuery(() => db.investments.toArray());
    const liquidAssets = useMemo(() => {
        if (!investments) return 0;
        return investments
            .filter(i => ['Stocks', 'Mutual Fund', 'Cash', 'Gold'].includes(i.type))
            .reduce((sum, i) => sum + i.currentValue, 0);
    }, [investments]);

    // 3. Calculate Runway
    const runwayMonths = monthlyBurn > 0 ? liquidAssets / monthlyBurn : 0;
    const isInfinite = monthlyBurn === 0 && liquidAssets > 0;

    // 4. Determine Persona State
    let state: 'CRITICAL' | 'SAFE' = 'CRITICAL';
    if (runwayMonths > 6 || isInfinite) state = 'SAFE';

    const config = {
        CRITICAL: { color: 'text-rose-500', bg: 'bg-rose-500', msg: "You are a wage slave. Get back to work.", badge: 'CODE RED', icon: Skull },
        SAFE: { color: 'text-emerald-500', bg: 'bg-emerald-500', msg: "You have breathing room.", badge: 'SECURE', icon: ShieldCheck }
    };

    const activeConfig = config[state];
    const percentage = Math.min(100, (runwayMonths / 12) * 100);

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">SURVIVAL RUNWAY</h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black font-mono tracking-tighter ${activeConfig.color}`}>
                            {isInfinite ? '∞' : runwayMonths.toFixed(1)}
                        </span>
                        <span className="text-sm font-bold text-slate-500 uppercase">MONTHS</span>
                    </div>
                </div>
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${activeConfig.color}`}>
                    <activeConfig.icon size={20} />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="my-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1.5 h-4 rounded-full ${activeConfig.bg}`} />
                    <div className="h-2 flex-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${activeConfig.bg} opacity-50`} style={{ width: `${percentage}%` }} />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-opacity-10 bg-slate-500 ${activeConfig.color} bg-slate-800`}>
                        {activeConfig.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        Burn: {formatCurrency(monthlyBurn)}/mo
                    </span>
                </div>
            </div>

            {/* Footer Quote */}
            <div className="border-l-2 border-slate-800 pl-3">
                <p className="text-xs text-slate-400 italic font-medium opacity-70">"{activeConfig.msg}"</p>
            </div>
        </div>
    );
};
