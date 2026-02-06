import React, { useState, useEffect, useMemo } from 'react';
import { AggregatedData, ASSET_CLASS_COLORS } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface RebalancingToolProps {
    allocationData: AggregatedData[]; // Current allocation (Asset Class level)
    totalValue: number;
    formatCurrency: (val: number) => string;
    onClose: () => void;
}

interface RebalanceItem {
    name: string;
    currentValue: number;
    currentPercent: number;
    targetPercent: number;
    targetValue: number;
    difference: number; // + means Buy, - means Sell
}

export const RebalancingTool: React.FC<RebalancingToolProps> = ({
    allocationData,
    totalValue,
    formatCurrency,
    onClose
}) => {
    // Local state for targets
    const [targets, setTargets] = useState<Record<string, number>>({});
    const [status, setStatus] = useState<'IDLE' | 'SAVED'>('IDLE');

    // Initialize inputs with current allocation if no saved targets
    useEffect(() => {
        // Try to load from localStorage
        const saved = localStorage.getItem('rebalance-targets');
        if (saved) {
            setTargets(JSON.parse(saved));
        } else {
            // Default to current allocation rounded
            const defaults: Record<string, number> = {};
            allocationData.forEach(d => {
                defaults[d.name] = Math.round((d.value / totalValue) * 100);
            });
            setTargets(defaults);
        }
    }, [allocationData, totalValue]);

    // Calculate Data
    const tableData: RebalanceItem[] = useMemo(() => {
        return allocationData.map(d => {
            const currentPercent = (d.value / totalValue) * 100;
            const targetPercent = targets[d.name] || 0;
            const targetValue = (targetPercent / 100) * totalValue;
            const difference = targetValue - d.value;

            return {
                name: d.name,
                currentValue: d.value,
                currentPercent,
                targetPercent,
                targetValue,
                difference
            };
        });
    }, [allocationData, totalValue, targets]);

    const totalTargetPercent = Object.values(targets).reduce((acc, curr) => acc + curr, 0);
    const totalCurrentPercent = allocationData.reduce((acc, curr) => acc + (curr.value / totalValue) * 100, 0);

    const handleTargetChange = (name: string, val: string) => {
        const num = parseFloat(val) || 0;
        setTargets(prev => ({ ...prev, [name]: num }));
        setStatus('IDLE');
    };

    const saveTargets = () => {
        localStorage.setItem('rebalance-targets', JSON.stringify(targets));
        setStatus('SAVED');
        setTimeout(() => setStatus('IDLE'), 2000);
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Portfolio Rebalance</h2>
                    <p className="text-sm text-slate-500">Adjust target weights to see Buy/Sell actions.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase">Total Portfolio</p>
                    <p className="text-xl font-bold font-mono dark:text-white">{formatCurrency(totalValue)}</p>
                </div>
            </div>

            {/* Validation Banner */}
            {Math.abs(totalTargetPercent - 100) > 0.1 && (
                <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={16} />
                    <span>Total Target Allocation is <strong>{totalTargetPercent.toFixed(1)}%</strong>. It should sum to 100%.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Visualizer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center relative border border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Target Allocation</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={tableData.map(d => ({ name: d.name, targetValue: d.targetValue }))}
                                    dataKey="targetValue"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    stroke="none"
                                >
                                    {tableData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ASSET_CLASS_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table & Inputs */}
                <div className="md:col-span-2 overflow-y-auto pr-2">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Asset Class</th>
                                <th className="px-4 py-3 text-right">Current %</th>
                                <th className="px-4 py-3 text-right">Target %</th>
                                <th className="px-4 py-3 text-right">Action</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tableData.map((item) => (
                                <tr key={item.name} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_CLASS_COLORS[item.name] || '#64748b' }}></div>
                                        <span className="dark:text-slate-200">{item.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                                        {item.currentPercent.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            value={targets[item.name] ?? item.currentPercent.toFixed(0)}
                                            onChange={(e) => handleTargetChange(item.name, e.target.value)}
                                            className="w-16 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {Math.abs(item.difference) < 100 ? (
                                            <span className="text-slate-400">-</span>
                                        ) : item.difference > 0 ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                                                BUY <TrendingUp size={12} />
                                            </span>
                                        ) : (
                                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center justify-end gap-1">
                                                SELL <TrendingDown size={12} />
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold dark:text-slate-200">
                                        <span className={item.difference > 0 ? 'text-emerald-600' : item.difference < 0 ? 'text-rose-600' : ''}>
                                            {formatCurrency(Math.abs(item.difference))}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 dark:border-slate-800">
                            <tr>
                                <td className="px-4 py-3 font-bold dark:text-white">Total</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-500">{totalCurrentPercent.toFixed(0)}%</td>
                                <td className={`px-4 py-3 text-right font-bold ${Math.abs(totalTargetPercent - 100) > 0.1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {totalTargetPercent.toFixed(0)}%
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Actions for Modal */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={saveTargets}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-sm font-medium"
                >
                    {status === 'SAVED' ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                    {status === 'SAVED' ? 'Saved' : 'Save as Target'}
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
};
