import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useTransactions } from '../../../contexts/TransactionContext';

interface TopMerchantsBarChartProps {
    formatCurrency: (val: number) => string;
}

export const TopMerchantsBarChart: React.FC<TopMerchantsBarChartProps> = ({ formatCurrency }) => {
    const { transactions } = useTransactions();

    const data = useMemo(() => {
        const merchantMap = new Map<string, number>();

        transactions.forEach(t => {
            if (t.type === 'debit' && t.merchant) {
                const current = merchantMap.get(t.merchant) || 0;
                merchantMap.set(t.merchant, current + t.amount);
            }
        });

        return Array.from(merchantMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7) // Top 7
            .map(item => ({
                ...item,
                // Truncate long names for Y-axis display
                displayName: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name
            }));
    }, [transactions]);

    const activeIndex = 0; // Highlight the top one

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Merchants</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="displayName"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => {
                                // Find full name based on truncated display name if needed, or just show label
                                return label;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#6366f1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
