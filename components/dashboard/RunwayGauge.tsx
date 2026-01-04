import React, { useMemo } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { db } from '../../database';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShieldAlert, ShieldCheck, Skull, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export const RunwayGauge: React.FC = () => {
    // 1. Get Monthly Burn (Avg of last 3 months)
    const { transactions } = useTransactions();

    const monthlyBurn = useMemo(() => {
        if (!transactions.length) return 0;

        // Filter out incomes and excluded txns
        const expenses = transactions.filter(t => t.type === 'debit' && !t.excluded);
        if (!expenses.length) return 0;

        // Find date range
        const dates = expenses.map(t => new Date(t.date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(); // Use today as anchor

        const diffMonths = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        const monthsDivisor = Math.max(1, diffMonths); // Avoid div by zero

        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        return totalExpense / monthsDivisor;
    }, [transactions]);

    // 2. Get Liquid Assets
    const investments = useLiveQuery(() => db.investments.toArray());
    const liquidAssets = useMemo(() => {
        if (!investments) return 0;
        // Filter for "Liquid" tags or generic types (Stocks, Cash, MF)
        // Adjust logic based on real tags if available, for now assume Stocks/MF/Cash are liquid
        return investments
            .filter(i => ['Stocks', 'Mutual Fund', 'Cash', 'Gold'].includes(i.type))
            .reduce((sum, i) => sum + i.currentValue, 0);
    }, [investments]);

    // 3. Calculate Runway
    const runwayMonths = monthlyBurn > 0 ? liquidAssets / monthlyBurn : 0;
    const isInfinite = monthlyBurn === 0 && liquidAssets > 0;

    // 4. Determine Persona State
    let state: 'PANIC' | 'WARNING' | 'SAFE' | 'FREEDOM' = 'PANIC';
    if (isInfinite || runwayMonths > 60) state = 'FREEDOM';
    else if (runwayMonths > 12) state = 'SAFE';
    else if (runwayMonths > 6) state = 'WARNING';

    const config = {
        PANIC: { color: 'text-rose-500', bg: 'bg-rose-500', icon: Skull, label: 'CODE RED', message: "You are a wage slave. Get back to work." },
        WARNING: { color: 'text-amber-500', bg: 'bg-amber-500', icon: ShieldAlert, label: 'CAUTION', message: "Job loss would be fatal. Tighten up." },
        SAFE: { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck, label: 'SECURE', message: "You have breathing room. Take calculated risks." },
        FREEDOM: { color: 'text-indigo-400', bg: 'bg-indigo-500', icon: TrendingUp, label: 'UNSHACKLED', message: "Work is optional. Pure alpha." }
    };

    const activeConfig = config[state];
    const percentage = Math.min(100, (runwayMonths / 24) * 100); // Max scale 24 months

    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${activeConfig.bg} opacity-5 blur-[50px] rounded-full`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Survival Runway</h3>
                    <div className={`text-3xl font-black font-mono flex items-baseline gap-2 ${activeConfig.color}`}>
                        {isInfinite ? '∞' : runwayMonths.toFixed(1)} <span className="text-sm font-bold text-slate-500">MONTHS</span>
                    </div>
                </div>
                <div className={`p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 ${activeConfig.color}`}>
                    <activeConfig.icon size={20} />
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
                <div
                    className={`h-full ${activeConfig.bg} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>

            {/* Skeptic Message */}
            <div className="flex justify-between items-center text-xs">
                <span className={`font-bold uppercase px-2 py-0.5 rounded bg-slate-800 ${activeConfig.color}`}>
                    {activeConfig.label}
                </span>
                <span className="text-slate-500 font-mono">
                    Burn: {formatCurrency(monthlyBurn)}/mo
                </span>
            </div>

            <p className="mt-3 text-xs text-slate-400 italic font-medium border-l-2 border-slate-700 pl-3">
                "{activeConfig.message}"
            </p>
        </div>
    );
};
