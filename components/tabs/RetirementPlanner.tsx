import React, { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp, Calendar, Target, AlertTriangle,
    RefreshCw, Info, DollarSign, Calculator, Play,
    ChevronRight, Shield, Loader2
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import { Investment } from '../../types';
import { useMonteCarloWorker } from '../../hooks/useMonteCarloWorker';

interface RetirementPlannerProps {
    investments: Investment[];
    currentCorpus: number;
    formatCurrency: (val: number) => string;
}

const RetirementPlanner: React.FC<RetirementPlannerProps> = ({
    investments, currentCorpus, formatCurrency
}) => {
    // --- State ---
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [expectedReturn, setExpectedReturn] = useState(12); // Equity return
    const [inflation, setInflation] = useState(6);
    const [volatility, setVolatility] = useState(15); // Std Dev
    const [monthlyContribution, setMonthlyContribution] = useState(25000);

    // Monte Carlo via Web Worker (prevents UI freeze)
    interface RetirementResult {
        simulations: { year: number; corpus: number }[][];
        successRate: number;
    }
    const { data: mcResult, isLoading: isSimulating, progress, run: runWorker } =
        useMonteCarloWorker<RetirementResult>('RETIREMENT');

    const simulations = mcResult?.simulations || [];
    const successRate = mcResult?.successRate || 0;

    // --- Calculations ---
    const yearsToRetirement = retirementAge - currentAge;
    const expenseAtRetirement = monthlyExpenses * Math.pow(1 + inflation / 100, yearsToRetirement);
    const requiredCorpus = (expenseAtRetirement * 12) / ((expectedReturn - inflation) / 100); // Simple Perpetuity
    // A safer withdrawal rate rule (4%)
    const safeCorpus = (expenseAtRetirement * 12) * 25;

    // --- Monte Carlo Engine (Web Worker) ---
    const runMonteCarlo = () => {
        runWorker({
            currentAge,
            retirementAge,
            currentCorpus,
            monthlyContribution,
            monthlyExpenses,
            expectedReturn,
            inflation,
            volatility,
            numSimulations: 500,
            forecastYears: 40
        });
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* HERDER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="text-emerald-500" />
                        RETIREMENT & FIRE
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Monte Carlo Simulation & Financial Independence Planner</p>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl font-bold font-mono border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <Shield size={16} />
                    Current Net Worth: {formatCurrency(currentCorpus)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. INPUT CONSOLE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                        <Calculator size={18} className="text-indigo-500" /> Parameters
                    </h3>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Current Age</label>
                                <input
                                    type="number" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-800 dark:text-white mt-1 p-2"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Retire Age</label>
                                <input
                                    type="number" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-800 dark:text-white mt-1 p-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Monthly Expenses (Today)</label>
                            <input
                                type="range" min="20000" max="500000" step="5000" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2 accent-indigo-500"
                            />
                            <div className="flex justify-between text-xs mt-1 font-bold text-slate-600 dark:text-slate-300">
                                <span>{formatCurrency(monthlyExpenses)} /mo</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Monthly Investment</label>
                            <input
                                type="range" min="0" max="500000" step="5000" value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2 accent-emerald-500"
                            />
                            <div className="flex justify-between text-xs mt-1 font-bold text-slate-600 dark:text-slate-300">
                                <span>{formatCurrency(monthlyContribution)} /mo</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Exp. Return (%)</label>
                                <input
                                    type="number" value={expectedReturn} onChange={e => setExpectedReturn(Number(e.target.value))}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-800 dark:text-white mt-1 p-2 text-center"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Inflation (%)</label>
                                <input
                                    type="number" value={inflation} onChange={e => setInflation(Number(e.target.value))}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-800 dark:text-white mt-1 p-2 text-center"
                                />
                            </div>
                        </div>

                        <button
                            onClick={runMonteCarlo}
                            disabled={isSimulating}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                        >
                            {isSimulating ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                            RUN SIMULATION - 1000 SCENARIOS
                        </button>
                    </div>
                </div>

                {/* 2. STATS & FIRE GOALS */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Required Corpus (Future Value)</h4>
                            <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                                {formatCurrency(safeCorpus)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">To sustain {formatCurrency(expenseAtRetirement)}/mo expenses @ {retirementAge}</p>
                        </div>

                        <div className={`${successRate > 90 ? 'bg-emerald-500' : successRate > 75 ? 'bg-amber-500' : 'bg-rose-500'} rounded-2xl p-5 shadow-lg text-white`}>
                            <h4 className="text-xs font-bold text-white/80 uppercase mb-2">Success Probability</h4>
                            <p className="text-4xl font-black font-mono">
                                {successRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-white/80 mt-1">From 500 Monte Carlo iterations</p>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
                        <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4">Monte Carlo Wealth Projections</h3>
                        <div className="h-[350px] w-full">
                            {simulations.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                                        <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                                        <YAxis tickFormatter={(val) => `${(val / 10000000).toFixed(0)}Cr`} />
                                        <Tooltip
                                            formatter={(val: number) => formatCurrency(val)}
                                            labelFormatter={(label) => `Age: ${label}`}
                                        />
                                        {simulations.map((s, i) => (
                                            <Line
                                                key={i}
                                                data={s}
                                                type="monotone"
                                                dataKey="corpus"
                                                stroke={i === 0 ? "#10b981" : "#6366f1"}
                                                strokeWidth={i === 0 ? 3 : 1}
                                                opacity={i === 0 ? 1 : 0.05}
                                                dot={false}
                                            />
                                        ))}
                                        <ReferenceLine x={retirementAge} stroke="orange" strokeDasharray="3 3" label="RETIRE" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <TrendingUp size={48} className="mb-4 opacity-20" />
                                    <p>Run simulation to view projections</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RetirementPlanner;
