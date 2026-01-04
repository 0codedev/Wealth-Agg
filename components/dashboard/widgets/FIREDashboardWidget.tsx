import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Calendar, Wallet, Calculator } from 'lucide-react';

interface FIREDashboardWidgetProps {
    stats?: { totalCurrent?: number; totalInvested?: number };
    formatCurrency?: (val: number) => string;
}

const FIREDashboardWidget: React.FC<FIREDashboardWidgetProps> = ({
    stats,
    formatCurrency = (v) => `₹${v.toLocaleString()}`
}) => {
    // FIRE parameters
    const [annualExpenses, setAnnualExpenses] = useState(600000); // ₹6L/year
    const [currentAge, setCurrentAge] = useState(30);
    const [targetAge, setTargetAge] = useState(45);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [withdrawalRate, setWithdrawalRate] = useState(4);

    const currentWealth = stats?.totalCurrent || 500000;
    const monthlyContribution = 25000;

    // Calculate FIRE number and progress
    const fireMetrics = useMemo(() => {
        const fireNumber = annualExpenses / (withdrawalRate / 100);
        const progress = Math.min(100, (currentWealth / fireNumber) * 100);

        // Years to FIRE calculation (simplified)
        const monthlyReturn = expectedReturn / 100 / 12;
        const months = Math.log((fireNumber * monthlyReturn + monthlyContribution) /
            (currentWealth * monthlyReturn + monthlyContribution)) / Math.log(1 + monthlyReturn);
        const yearsToFire = Math.max(0, months / 12);

        const fireAge = currentAge + yearsToFire;
        const onTrack = fireAge <= targetAge;

        return { fireNumber, progress, yearsToFire, fireAge, onTrack };
    }, [annualExpenses, currentWealth, expectedReturn, withdrawalRate, currentAge, targetAge, monthlyContribution]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900 rounded-2xl border border-orange-500/20 p-4 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Flame size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">FIRE Dashboard</h3>
                        <p className="text-[9px] text-slate-500">Financial Independence</p>
                    </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${fireMetrics.onTrack ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {fireMetrics.onTrack ? 'ON TRACK' : 'ADJUST PLAN'}
                </span>
            </div>

            {/* FIRE Number & Progress */}
            <div className="bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">FIRE Number</span>
                    <span className="text-lg font-black text-orange-400 font-mono">
                        {formatCurrency(fireMetrics.fireNumber)}
                    </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fireMetrics.progress}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500">
                    <span>{formatCurrency(currentWealth)}</span>
                    <span>{fireMetrics.progress.toFixed(1)}% complete</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-1 mb-1">
                        <Calendar size={10} className="text-blue-400" />
                        <span className="text-[9px] text-slate-500">Years to FIRE</span>
                    </div>
                    <p className="text-sm font-bold text-white">{fireMetrics.yearsToFire.toFixed(1)} yrs</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-1 mb-1">
                        <Target size={10} className="text-emerald-400" />
                        <span className="text-[9px] text-slate-500">FIRE Age</span>
                    </div>
                    <p className="text-sm font-bold text-white">{Math.round(fireMetrics.fireAge)} years</p>
                </div>
            </div>

            {/* Quick Settings */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Annual Expenses</span>
                    <input
                        type="number"
                        value={annualExpenses}
                        onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                        className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-white text-right"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Withdrawal Rate</span>
                    <div className="flex items-center gap-1">
                        <input
                            type="range"
                            min="3"
                            max="5"
                            step="0.5"
                            value={withdrawalRate}
                            onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                            className="w-16 h-1"
                        />
                        <span className="text-[10px] text-white w-8">{withdrawalRate}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FIREDashboardWidget;
