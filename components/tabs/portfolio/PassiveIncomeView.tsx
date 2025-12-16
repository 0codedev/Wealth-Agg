
import React, { useMemo } from 'react';
import {
    Zap, Coins, CalendarClock, Target,
    BarChart3, Droplet
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { CustomTooltip } from '../../shared/CustomTooltip';
import { Investment, InvestmentType } from '../../../types';

interface PassiveIncomeViewProps {
    investments: Investment[];
    totalAssets: number;
    formatCurrency: (val: number) => string;
}

const ESTIMATED_YIELDS: Record<string, number> = {
    [InvestmentType.STOCKS]: 1.2,
    [InvestmentType.MUTUAL_FUND]: 0.5,
    [InvestmentType.ETF]: 1.0,
    [InvestmentType.REAL_ESTATE]: 4.5,
    [InvestmentType.FD]: 6.5,
    [InvestmentType.CASH]: 3.0,
    [InvestmentType.DIGITAL_GOLD]: 0,
    [InvestmentType.CRYPTO]: 0,
    [InvestmentType.SMALLCASE]: 1.0,
    [InvestmentType.TRADING]: 0
};

export const PassiveIncomeView: React.FC<PassiveIncomeViewProps> = ({ investments, totalAssets, formatCurrency }) => {
    const passiveIncomeStats = useMemo(() => {
        let annualIncome = 0;

        const assetYields = investments.map(inv => {
            const yieldRate = ESTIMATED_YIELDS[inv.type] || 0;
            const estimatedAnnual = inv.currentValue * (yieldRate / 100);

            if (yieldRate > 0) {
                annualIncome += estimatedAnnual;
            }

            return {
                ...inv,
                yieldRate,
                estimatedAnnual
            };
        }).filter(i => i.estimatedAnnual > 0).sort((a, b) => b.estimatedAnnual - a.estimatedAnnual);

        const portfolioYield = totalAssets > 0 ? (annualIncome / totalAssets) * 100 : 0;
        const monthlyAverage = annualIncome / 12;

        // Generate Calendar Distribution (Simulated)
        const monthlyDist = Array(12).fill(0);
        assetYields.forEach(inv => {
            if (inv.type === InvestmentType.FD || inv.type === InvestmentType.REAL_ESTATE) {
                const monthly = inv.estimatedAnnual / 12;
                for (let i = 0; i < 12; i++) monthlyDist[i] += monthly;
            } else {
                const qPayout = inv.estimatedAnnual / 2;
                monthlyDist[2] += qPayout * 0.6; // March/April
                monthlyDist[7] += qPayout * 0.4; // August
            }
        });

        const chartData = monthlyDist.map((val, idx) => ({
            month: new Date(0, idx).toLocaleString('default', { month: 'short' }),
            income: Math.round(val)
        }));

        return { annualIncome, portfolioYield, monthlyAverage, assetYields, chartData };
    }, [investments, totalAssets]);

    const { annualIncome, portfolioYield, monthlyAverage, chartData, assetYields } = passiveIncomeStats;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">

            {/* THE CASH MACHINE DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Annual Card */}
                <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-6 relative overflow-hidden text-white shadow-lg shadow-emerald-900/50">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Zap size={14} /> Projected Annual Income
                        </p>
                        <h2 className="text-4xl font-black mb-2">
                            {formatCurrency(annualIncome)}
                        </h2>
                        <div className="flex items-center gap-2 bg-emerald-800/50 w-fit px-3 py-1 rounded-lg border border-emerald-700">
                            <span className="text-sm font-bold">{portfolioYield.toFixed(2)}%</span>
                            <span className="text-[10px] text-emerald-200">Portfolio Yield</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Average Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <CalendarClock size={16} className="text-indigo-500" /> Monthly Average
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                        {formatCurrency(monthlyAverage)}
                    </h2>
                    <p className="text-xs text-slate-400">Hypothetical cash flow if distributed evenly.</p>
                </div>

                {/* Top Payer Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Target size={16} className="text-amber-500" /> Top Payer
                    </p>
                    {assetYields.length > 0 ? (
                        <>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                                {assetYields[0].name}
                            </h2>
                            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {formatCurrency(assetYields[0].estimatedAnnual)} / yr
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400 italic">No yielding assets found.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PAYOUT RADAR (CHART) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-indigo-500" /> Payout Radar
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="income" radius={[4, 4, 0, 0]} fill="#10b981">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.income > monthlyAverage ? '#10b981' : '#34d399'} opacity={entry.income > monthlyAverage ? 1 : 0.6} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* YIELD HUNT (LIST) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Droplet size={20} className="text-cyan-500" /> Yield Hunt
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-64">
                        {assetYields.map(asset => (
                            <div key={asset.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{asset.name}</p>
                                    <p className="text-[10px] text-slate-500">{asset.type} • {asset.yieldRate}% Yield</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +{formatCurrency(asset.estimatedAnnual)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {assetYields.length === 0 && (
                            <div className="text-center text-slate-400 text-sm py-10">Add Stocks or Mutual Funds to see potential income.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
