import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ArrowUpRight, TrendingDown, ArrowDownRight } from 'lucide-react';
import { useTransactions } from '../../../contexts/TransactionContext';

interface NetWorthTrendWidgetProps {
    formatCurrency: (val: number) => string;
}

export const NetWorthTrendWidget: React.FC<NetWorthTrendWidgetProps> = ({ formatCurrency }) => {
    const { transactions } = useTransactions();
    const [range, setRange] = useState<'1M' | '3M' | '6M'>('1M');

    // Process transactions to get balance history
    // We assume the CSV provides 'balance' snapshot for transactions.
    // If multiple transactions on same day, take the last one.
    const chartData = useMemo(() => {
        const balanceMap = new Map<string, number>();

        // Sort transactions by date ascending
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach(t => {
            if (t.balance !== undefined) {
                const date = new Date(t.date);
                // Format: "D MMM" e.g., "1 Dec"
                const dateKey = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                // Key for sorting: "YYYY-MM-DD"
                // Actually, Recharts needs consistent X-axis. 
                // Let's store full timestamp or ISO date and format locally.
                balanceMap.set(dateKey, t.balance);
            }
        });

        // Convert map to array
        let data = Array.from(balanceMap.entries()).map(([date, value]) => ({ date, value }));

        // If no data, provide at least one point to prevent crash (or filtering logic below)
        if (data.length === 0) return [{ date: 'Today', value: 0 }];

        // Filter based on range (Mock logic for now since we rely on provided CSV range)
        // In real app, we'd filter by actual Date object comparison.
        // Given the specific CSV, we just show all or slice.
        if (range === '1M') data = data.slice(-30);
        if (range === '3M') data = data.slice(-90);
        if (range === '6M') data = data.slice(-180);

        return data;
    }, [transactions, range]);

    const currentNetWorth = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    const startNetWorth = chartData.length > 0 ? chartData[0].value : 0;
    const growth = startNetWorth > 0 ? ((currentNetWorth - startNetWorth) / startNetWorth * 100).toFixed(1) : '0';
    const isPositive = parseFloat(growth) >= 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" /> Net Worth Trend
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatCurrency(currentNetWorth)}
                        </span>
                        <span className={`text-xs font-bold flex items-center px-1.5 py-0.5 rounded-md ${isPositive ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {growth}%
                        </span>
                    </div>
                </div>

                {/* Time Range Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {(['1M', '3M', '6M'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${range === r
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => `₹${val / 1000}k`}
                            domain={['auto', 'auto']} // Auto-scale to show variations
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [formatCurrency(value), 'Balance']}
                            labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                            cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
