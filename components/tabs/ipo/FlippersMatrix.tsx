import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Timer, Banknote } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

const FlippersMatrix: React.FC = () => {
    // --- Feature 6: The Flipper's Matrix State ---
    const [flipperAmount, setFlipperAmount] = useState<number>(15000);
    const [lockInDays, setLockInDays] = useState<number>(4);
    const [expectedGmpVal, setExpectedGmpVal] = useState<number>(2500);
    const [swingReturnPct, setSwingReturnPct] = useState<number>(2.5);

    // Trending Logic
    const [marketTrend, setMarketTrend] = useState<number>(0); // -20% to +20%

    // Flipper's Matrix Logic
    const flipperStats = useMemo(() => {
        // 1. IPO Return
        // Absolute = Expected GMP + Trend Impact
        const trendImpact = expectedGmpVal * (marketTrend / 100);
        const adjustedGmp = expectedGmpVal + trendImpact;

        const ipoAbsReturn = adjustedGmp;
        const ipoRoi = (ipoAbsReturn / flipperAmount);
        const ipoAnnualized = ipoRoi * (365 / Math.max(1, lockInDays)) * 100;

        // 2. Swing Trade
        // Absolute = Capital * (Swing% / 100)
        // Annualized = (Swing% / 100) * (365 / LockIn) * 100
        const swingAbsReturn = flipperAmount * (swingReturnPct / 100);
        const swingAnnualized = (swingReturnPct / 100) * (365 / Math.max(1, lockInDays)) * 100;

        const isIPOBetter = ipoAbsReturn > swingAbsReturn;

        return { ipoAbsReturn, ipoAnnualized, swingAbsReturn, swingAnnualized, isIPOBetter, adjustedGmp };
    }, [flipperAmount, lockInDays, expectedGmpVal, swingReturnPct, marketTrend]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft size={20} className="text-indigo-500" /> The Flipper's Matrix
                </h3>
            </div>

            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lock-in Days</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <Timer size={14} className="text-slate-400" />
                            <input
                                type="number"
                                value={lockInDays}
                                onChange={(e) => setLockInDays(parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-sm font-bold outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Est. IPO Gain (₹)</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <Banknote size={14} className="text-emerald-500" />
                            <input
                                type="number"
                                value={expectedGmpVal}
                                onChange={(e) => setExpectedGmpVal(parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-sm font-bold outline-none text-emerald-600 dark:text-emerald-400"
                            />
                        </div>
                    </div>
                </div>

                {/* GMP TREND SLIDER */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Listing Sentiment</label>
                        <span className={`text-xs font-bold ${marketTrend > 0 ? 'text-emerald-500' : marketTrend < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {marketTrend > 0 ? '+' : ''}{marketTrend}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="-20"
                        max="20"
                        step="5"
                        value={marketTrend}
                        onChange={(e) => setMarketTrend(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-bold uppercase">
                        <span>Panic (-20%)</span>
                        <span>Neutral</span>
                        <span>Hype (+20%)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* IPO Side */}
                    <div className={`p-4 rounded-xl border-2 flex flex-col justify-between ${flipperStats.isIPOBetter ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-950 border-transparent'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">IPO Strategy</p>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{flipperStats.ipoAnnualized.toFixed(0)}%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Annualized Return</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500">Net Profit: <span className="font-mono font-bold text-emerald-500">+{formatCurrency(flipperStats.ipoAbsReturn)}</span></p>
                        </div>
                    </div>

                    {/* Swing Side */}
                    <div className={`p-4 rounded-xl border-2 flex flex-col justify-between ${!flipperStats.isIPOBetter ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500' : 'bg-slate-50 dark:bg-slate-950 border-transparent'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Swing Alt.</p>
                            <input
                                type="number"
                                value={swingReturnPct}
                                onChange={(e) => setSwingReturnPct(parseFloat(e.target.value))}
                                className="w-10 bg-transparent text-right text-xs font-bold text-indigo-500 outline-none border-b border-indigo-300"
                            />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{flipperStats.swingAnnualized.toFixed(0)}%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Annualized Return</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500">Net Profit: <span className="font-mono font-bold text-indigo-500">+{formatCurrency(flipperStats.swingAbsReturn)}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlippersMatrix;
