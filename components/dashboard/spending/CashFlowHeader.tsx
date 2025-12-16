import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../../contexts/TransactionContext';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon } from 'lucide-react';

interface CashFlowHeaderProps {
    formatCurrency: (val: number) => string;
}

type TimeRange = 'T' | 'W' | 'M' | 'Y' | 'ALL';

export const CashFlowHeader: React.FC<CashFlowHeaderProps> = ({ formatCurrency }) => {
    const { transactions } = useTransactions();
    const [range, setRange] = useState<TimeRange>('M');

    const filteredStats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const filteredTxns = transactions.filter(t => {
            const tDate = new Date(t.date);
            if (range === 'T') return tDate >= startOfDay;
            if (range === 'W') return tDate >= startOfWeek;
            if (range === 'M') return tDate >= startOfMonth;
            if (range === 'Y') return tDate >= startOfYear;
            return true;
        });

        // Calculate totals
        const expense = filteredTxns
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Simple income simulation (usually credit txns, but we might rely on mock scale)
        // For accurate tracking, we should sum actual credit transactions if available
        // Fallback: Mock Income = Expense * 1.4 for demo logic if no credits found
        const creditSum = filteredTxns
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        const income = creditSum > 0 ? creditSum : expense * 1.4;
        const savings = income - expense;
        const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

        return { income, expense, savings, savingsRate };
    }, [transactions, range]);

    return (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 p-12 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-12 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <p className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Net Cash Flow</p>
                        <h2 className="text-4xl font-black">{formatCurrency(filteredStats.savings)}</h2>
                        <p className={`text-sm mt-2 flex items-center gap-1 font-bold ${filteredStats.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {filteredStats.savings >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {filteredStats.savingsRate}% Savings Rate
                        </p>
                    </div>

                    {/* Time Filters */}
                    <div className="bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center">
                        {(['T', 'W', 'M', 'Y', 'ALL'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r
                                        ? 'bg-indigo-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {r === 'ALL' ? 'End' : r}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-white/10 mx-1"></div>
                        <button className="px-2 py-1.5 text-slate-400 hover:text-white">
                            <CalendarIcon size={14} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                            <ArrowDownRight size={14} className="text-emerald-400" /> Income
                        </p>
                        <p className="text-xl font-bold">{formatCurrency(filteredStats.income)}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                            <ArrowUpRight size={14} className="text-rose-400" /> Expense
                        </p>
                        <p className="text-xl font-bold">{formatCurrency(filteredStats.expense)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
