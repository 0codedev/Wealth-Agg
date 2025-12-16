import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { Activity, Skull } from 'lucide-react';
import { Trade } from '../../../database';
import { formatCurrency } from '../../../utils/helpers';

interface TiltMeterProps {
    trades: Trade[];
}

const needle = (value: number, cx: number, cy: number, iR: number, oR: number, color: string) => {
    const total = 180;
    const ang = 180 - (value / 100) * total;
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-Math.PI / 180 * ang);
    const cos = Math.cos(-Math.PI / 180 * ang);
    const r = 5;
    const x0 = cx + 5;
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;
    return (
        <React.Fragment key="needle">
            <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" />
            <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill={color} />
        </React.Fragment>
    );
};

export const TiltMeter: React.FC<TiltMeterProps> = ({ trades }) => {
    const tiltStats = useMemo(() => {
        const emotionalStates = ['Anxious', 'Revenge', 'Greedy', 'Panic', 'Regret', 'Euphoric'];
        const total = trades.length;
        if (total === 0) return { score: 0, label: 'NO DATA', color: '#64748b' };
        let tiltCount = 0;
        trades.forEach(t => {
            if (emotionalStates.includes(t.moodEntry) || emotionalStates.includes(t.moodExit)) {
                tiltCount++;
            }
        });
        const score = Math.min(100, Math.round((tiltCount / total) * 100));
        let label = 'ZEN MASTER';
        let color = '#10b981'; // Green
        if (score > 20) { label = 'FOCUSED'; color = '#34d399'; }
        if (score > 40) { label = 'DISTRACTED'; color = '#f59e0b'; }
        if (score > 60) { label = 'ON TILT'; color = '#f43f5e'; }
        if (score > 80) { label = 'RAGE TRADING'; color = '#ef4444'; }
        return { score, label, color, tiltCount, total };
    }, [trades]);

    const mistakeData = useMemo(() => {
        const map: Record<string, { cost: number, count: number }> = {};
        trades.forEach(t => {
            if ((t.pnl || 0) < 0 && t.mistakes && t.mistakes.length > 0) {
                t.mistakes.forEach(m => {
                    if (!map[m]) map[m] = { cost: 0, count: 0 };
                    map[m].count++;
                    map[m].cost += Math.abs(t.pnl || 0);
                });
            }
        });
        return Object.entries(map)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 6);
    }, [trades]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-50"></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={16} /> Tilt-O-Meter
                </h3>
                <div className="w-full h-48 relative flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                dataKey="value"
                                startAngle={180}
                                endAngle={0}
                                data={[
                                    { name: 'Zen', value: 33, color: '#10b981' },
                                    { name: 'Neutral', value: 33, color: '#f59e0b' },
                                    { name: 'Tilt', value: 34, color: '#ef4444' },
                                ]}
                                cx="50%"
                                cy="60%"
                                innerRadius={60}
                                outerRadius={80}
                                stroke="none"
                            >
                                {[
                                    { name: 'Zen', value: 33, color: '#10b981' },
                                    { name: 'Neutral', value: 33, color: '#f59e0b' },
                                    { name: 'Tilt', value: 34, color: '#ef4444' },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {needle(tiltStats.score, 0, 0, 60, 80, tiltStats.color)}
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-10 flex flex-col items-center">
                        <h2 className="text-3xl font-black" style={{ color: tiltStats.color }}>{tiltStats.score}%</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{tiltStats.label}</p>
                    </div>
                </div>
                <div className="w-full mt-4 p-3 bg-slate-900/50 rounded-xl text-center border border-white/5">
                    <p className="text-xs text-slate-500 mb-1">Impact Analysis</p>
                    <p className="text-sm font-medium text-slate-300">
                        You trade <span className="font-bold text-white">{tiltStats.score > 50 ? 'WORSE' : 'BETTER'}</span> when emotional.
                    </p>
                </div>
            </div>

            <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Skull size={16} className="text-rose-500" /> The Cost of Errors
                    </h3>
                    <span className="text-xs text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
                        Total Waste: {formatCurrency(mistakeData.reduce((a, b) => a + b.cost, 0))}
                    </span>
                </div>
                {mistakeData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic border border-dashed border-white/10 rounded-xl">
                        No mistakes logged yet. Good job!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mistakeData.map((m) => (
                            <div key={m.name} className="relative group">
                                <div className="flex items-center justify-between text-sm relative z-10 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-200">{m.name}</span>
                                        <span className="text-xs text-slate-500">({m.count}x)</span>
                                    </div>
                                    <span className="font-mono font-bold text-rose-500">-{formatCurrency(m.cost)}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full"
                                        style={{ width: `${Math.max((m.cost / mistakeData[0].cost) * 100, 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
