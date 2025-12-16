
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, AlertTriangle, Target, Gauge, Zap, TrendingDown, Info, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import { runMonteCarlo } from '../../../utils/MonteCarlo';
// import Sparkline from '../../Sparkline'; // Removed dependency if not strictly needed or ensure path is correct

interface OracleHubProps {
    totalPortfolioValue: number;
    monthlyInvestment?: number;
}

const OracleHub: React.FC<OracleHubProps> = ({ totalPortfolioValue, monthlyInvestment = 25000 }) => {
    // --- State ---
    const [targetWealth, setTargetWealth] = useState(10000000); // 1 Cr default
    const [yearsToGoal, setYearsToGoal] = useState(10);
    const [crashScenario, setCrashScenario] = useState(0); // 0 to -50%

    // --- Monte Carlo Engine ---
    const simulation = useMemo(() => {
        return runMonteCarlo(totalPortfolioValue, monthlyInvestment, yearsToGoal, targetWealth);
    }, [totalPortfolioValue, monthlyInvestment, yearsToGoal, targetWealth]);

    // --- Stress Test Calculation ---
    const crashedValue = totalPortfolioValue * (1 + (crashScenario / 100));
    const lossAmount = totalPortfolioValue - crashedValue;

    // --- UI Helpers ---
    const getProbColor = (prob: number) => {
        if (prob > 80) return 'text-emerald-400';
        if (prob > 50) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden group mb-6">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-1000 group-hover:bg-purple-500/20"></div>

            <div className="relative z-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                            <Sparkles className="text-amber-400 fill-amber-400" size={24} />
                            THE ORACLE
                        </h2>
                        <p className="text-indigo-200/60 text-sm font-medium">Predictive Wealth Engine & Stress Tester</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        Gold Tier
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* SECTION 1: MONTE CARLO PROJECTOR */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-indigo-300 uppercase flex items-center gap-2">
                            <Target size={16} /> Goal Probability
                        </h3>

                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-indigo-500/20 backdrop-blur-sm">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Target Wealth</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={targetWealth}
                                            onChange={e => setTargetWealth(parseFloat(e.target.value) || 0)}
                                            className="bg-transparent text-xl font-mono font-bold text-white outline-none w-32 border-b border-dashed border-slate-700 focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Time Horizon</p>
                                    <div className="flex items-center justify-end gap-1">
                                        <input
                                            type="number"
                                            value={yearsToGoal}
                                            onChange={e => setYearsToGoal(parseFloat(e.target.value) || 0)}
                                            className="bg-transparent text-xl font-mono font-bold text-white outline-none w-12 text-right border-b border-dashed border-slate-700 focus:border-indigo-500"
                                        />
                                        <span className="text-sm text-slate-500 font-bold">Yrs</span>
                                    </div>
                                </div>
                            </div>

                            {/* The Gauge */}
                            <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full transition-all duration-1000 ${simulation.successProbability > 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : simulation.successProbability > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${simulation.successProbability}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-2xl font-black ${getProbColor(simulation.successProbability)}`}>
                                    {simulation.successProbability.toFixed(1)}%
                                </span>
                                <span className="text-xs text-slate-400 font-medium">Chance of Success</span>
                            </div>
                        </div>

                        {/* Outcomes */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Pessimistic</p>
                                <p className="text-xs font-mono font-bold text-rose-400">{formatCurrency(simulation.percentiles.p10)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Median</p>
                                <p className="text-xs font-mono font-bold text-indigo-300">{formatCurrency(simulation.percentiles.p50)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Optimistic</p>
                                <p className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(simulation.percentiles.p90)}</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CRASH TEST DUMMY */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-rose-300 uppercase flex items-center gap-2">
                            <ShieldAlert size={16} /> Crash Test Dummy
                        </h3>

                        <div className={`rounded-2xl p-5 border transition-all duration-500 ${crashScenario < -20 ? 'bg-rose-950/30 border-rose-500/30' : 'bg-slate-950/50 border-slate-800'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold text-slate-400 uppercase">Market Shock</span>
                                <span className="text-xl font-black text-rose-500 font-mono">{crashScenario}%</span>
                            </div>

                            <input
                                type="range"
                                min="-50"
                                max="0"
                                step="5"
                                value={crashScenario}
                                onChange={e => setCrashScenario(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 mb-6"
                            />

                            <div className="pt-4 border-t border-slate-800/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500">Portfolio After Shock</span>
                                    <span className="text-lg font-mono font-bold text-white transition-all">
                                        {formatCurrency(crashedValue)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-rose-500/70">Wiped Out Wealth</span>
                                    <span className="text-sm font-mono font-bold text-rose-500 transition-all">
                                        {formatCurrency(lossAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {[-10, -20, -30, -50].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setCrashScenario(val)}
                                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700 transition-colors"
                                >
                                    {val}%
                                </button>
                            ))}
                            <button
                                onClick={() => setCrashScenario(0)}
                                className="px-3 py-1 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 transition-colors ml-auto"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OracleHub;
