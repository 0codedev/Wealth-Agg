import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, CartesianGrid, ReferenceLine
} from 'recharts';
import {
    Clock, RefreshCcw, Zap, TrendingUp, TrendingDown, ToggleLeft, ToggleRight
} from 'lucide-react';

import { Trade } from '../../database';
import { formatCurrency } from '../../utils/helpers';
import { CustomTooltip } from '../shared/CustomTooltip';

// Imported Sub-Components
import { EquityCurveCard } from './analytics/EquityCurveCard';
import { ExpectancyEngine } from './analytics/ExpectancyEngine';
import { TiltMeter } from './analytics/TiltMeter';
import { EdgeMatrix } from './analytics/EdgeMatrix';

interface JournalAnalyticsProps {
    trades: Trade[];
    timeframe: 'ALL' | '30D' | '90D';
    ignoredMistakes: string[];
    setIgnoredMistakes: React.Dispatch<React.SetStateAction<string[]>>;
}

const JournalAnalytics: React.FC<JournalAnalyticsProps> = ({ trades: allTrades, timeframe, ignoredMistakes, setIgnoredMistakes }) => {

    const filteredTrades = useMemo(() => {
        if (timeframe === 'ALL') return allTrades;
        const now = new Date();
        const days = timeframe === '30D' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        return allTrades.filter(t => new Date(t.date) >= cutoff);
    }, [allTrades, timeframe]);

    // --- BEHAVIORAL ANALYTICS (Kept here as it spans multiple areas) ---
    const hourlyStats = useMemo(() => {
        const map: Record<string, { pnl: number, count: number }> = {};
        ['09', '10', '11', '12', '13', '14', '15'].forEach(h => map[h] = { pnl: 0, count: 0 });

        filteredTrades.forEach(t => {
            if (t.entryTime) {
                const hour = t.entryTime.split(':')[0];
                if (map[hour]) {
                    map[hour].pnl += (t.pnl || 0);
                    map[hour].count++;
                }
            }
        });

        return Object.entries(map).map(([hour, data]) => ({
            hour: `${hour}:00`,
            pnl: data.pnl,
            count: data.count
        }));
    }, [filteredTrades]);

    const directionalStats = useMemo(() => {
        let longPnL = 0, shortPnL = 0;
        let longCount = 0, shortCount = 0;
        let longWins = 0, shortWins = 0;

        filteredTrades.forEach(t => {
            if (t.direction === 'Long') {
                longPnL += (t.pnl || 0);
                longCount++;
                if ((t.pnl || 0) > 0) longWins++;
            } else {
                shortPnL += (t.pnl || 0);
                shortCount++;
                if ((t.pnl || 0) > 0) shortWins++;
            }
        });

        return {
            long: { pnl: longPnL, count: longCount, winRate: longCount > 0 ? (longWins / longCount) * 100 : 0 },
            short: { pnl: shortPnL, count: shortCount, winRate: shortCount > 0 ? (shortWins / shortCount) * 100 : 0 }
        };
    }, [filteredTrades]);

    const whatIfStats = useMemo(() => {
        const actualPnL = filteredTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        let potentialPnL = 0;

        potentialPnL = filteredTrades.reduce((acc, t) => {
            if (t.mistakes?.some(m => ignoredMistakes.includes(m))) return acc;
            return acc + (t.pnl || 0);
        }, 0);

        const diff = potentialPnL - actualPnL;
        return { actualPnL, potentialPnL, diff };
    }, [filteredTrades, ignoredMistakes]);

    const allMistakes = useMemo(() => {
        const set = new Set<string>();
        filteredTrades.forEach(t => t.mistakes?.forEach(m => set.add(m)));
        return Array.from(set);
    }, [filteredTrades]);

    return (
        <div className="space-y-6 animate-in slide-in-from-left-4">

            {/* 1. EQUITY CURVE Engine */}
            <EquityCurveCard trades={filteredTrades} />

            {/* 2. EXPECTANCY Engine */}
            <ExpectancyEngine trades={filteredTrades} />

            {/* 3. TILT & PSYCH Engine */}
            <TiltMeter trades={filteredTrades} />

            {/* 4. BEHAVIORAL & WHAT-IF Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* CHRONOBIOLOGY */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" /> Chronobiology
                        </h3>
                    </div>
                    <div className="h-48 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="pnl">
                                    {hourlyStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
                                <TrendingUp size={12} /> Long Bias
                            </p>
                            <div className="flex justify-between items-end">
                                <span className={`text-sm font-black font-mono ${directionalStats.long.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(directionalStats.long.pnl)}</span>
                                <span className="text-[10px] text-slate-400">{directionalStats.long.winRate.toFixed(0)}% WR</span>
                            </div>
                        </div>
                        <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                            <p className="text-xs text-rose-400 font-bold uppercase mb-1 flex items-center gap-1">
                                <TrendingDown size={12} /> Short Bias
                            </p>
                            <div className="flex justify-between items-end">
                                <span className={`text-sm font-black font-mono ${directionalStats.short.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(directionalStats.short.pnl)}</span>
                                <span className="text-[10px] text-slate-400">{directionalStats.short.winRate.toFixed(0)}% WR</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* THE WHAT-IF SIMULATOR */}
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <RefreshCcw size={100} className="text-indigo-500" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                            <RefreshCcw size={20} className="text-indigo-400" /> The What-If Simulator
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Eliminate specific mistakes to see your potential.</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {allMistakes.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setIgnoredMistakes(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${ignoredMistakes.includes(m) ? 'bg-rose-500/20 border-rose-500 text-rose-400 line-through opacity-70' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500'}`}
                                >
                                    {ignoredMistakes.includes(m) ? <ToggleLeft size={14} /> : <ToggleRight size={14} />} {m}
                                </button>
                            ))}
                            {allMistakes.length === 0 && <span className="text-xs text-slate-600 italic">No mistakes logged yet.</span>}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-slate-500 uppercase">Actual PnL</span>
                                <span className={`font-mono font-bold ${whatIfStats.actualPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(whatIfStats.actualPnL)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
                                <span className="text-xs font-bold text-indigo-300 uppercase relative z-10 flex items-center gap-2"><Zap size={12} /> Potential PnL</span>
                                <span className={`font-mono font-bold relative z-10 text-xl ${whatIfStats.potentialPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(whatIfStats.potentialPnL)}</span>
                            </div>

                            {whatIfStats.diff > 0 && (
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Cost of Bad Habits</p>
                                    <p className="text-lg font-black text-rose-500">{formatCurrency(whatIfStats.diff)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. EDGE MATRIX */}
            <EdgeMatrix trades={filteredTrades} />
        </div>
    );
};

export default JournalAnalytics;
