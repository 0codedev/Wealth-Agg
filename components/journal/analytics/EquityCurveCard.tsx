import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { LineChart, Waves } from 'lucide-react';
import { Trade } from '../../../database';
import { formatCurrency } from '../../../utils/helpers';
import { CustomTooltip } from '../../shared/CustomTooltip';

interface EquityCurveCardProps {
    trades: Trade[];
}

const CustomMistakeDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.hasMistake) {
        return (
            <g>
                <circle cx={cx} cy={cy} r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#f43f5e" fontSize={10} fontWeight="bold">!</text>
            </g>
        );
    }
    return <circle cx={cx} cy={cy} r={0} />;
};

export const EquityCurveCard: React.FC<EquityCurveCardProps> = ({ trades }) => {
    const equityData = useMemo(() => {
        const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const dailyMap: Record<string, number> = {};
        sorted.forEach(t => {
            dailyMap[t.date] = (dailyMap[t.date] || 0) + (t.pnl || 0);
        });

        let runningTotal = 0;
        let peak = 0;
        const curve = Object.entries(dailyMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, dailyPnL]) => {
            runningTotal += dailyPnL;
            if (runningTotal > peak) peak = runningTotal;
            const drawdown = runningTotal - peak;

            const tradesOnDate = trades.filter(t => t.date === date);
            const hasMistake = tradesOnDate.some(t => t.mistakes && t.mistakes.length > 0);
            const mistakes = tradesOnDate.flatMap(t => t.mistakes || []);

            return {
                date,
                dailyPnL,
                equity: runningTotal,
                drawdown: drawdown,
                peak: peak,
                hasMistake,
                mistakes
            };
        });

        if (curve.length === 0) return [];
        return curve;
    }, [trades]);

    const maxDrawdown = useMemo(() => {
        if (equityData.length === 0) return 0;
        return Math.min(...equityData.map(d => d.drawdown));
    }, [equityData]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* EQUITY CURVE */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <LineChart size={16} className="text-indigo-500" /> The Equity Curve
                        </h3>
                        <p className="text-xs text-slate-500">Cumulative PnL Performance</p>
                    </div>
                    {equityData.length > 0 && (
                        <div className={`px-3 py-1 rounded-lg text-sm font-black font-mono ${equityData[equityData.length - 1].equity >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                            {formatCurrency(equityData[equityData.length - 1].equity)}
                        </div>
                    )}
                </div>
                <div className="h-64 w-full">
                    {equityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="date" hide />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" opacity={0.5} />
                                <Area
                                    name="Total PnL"
                                    type="monotone"
                                    dataKey="equity"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorEquity)"
                                    dot={<CustomMistakeDot />}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
                            Log trades to visualize your curve.
                        </div>
                    )}
                </div>
            </div>

            {/* DRAWDOWN CHART */}
            <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Waves size={16} className="text-rose-500" /> Underwater
                        </h3>
                        <p className="text-xs text-slate-500">Drawdown</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Max DD</p>
                        <p className="text-sm font-black font-mono text-rose-500">{formatCurrency(maxDrawdown)}</p>
                    </div>
                </div>
                <div className="h-64 w-full">
                    {equityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="date" hide />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Area
                                    name="Drawdown"
                                    type="step"
                                    dataKey="drawdown"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorDD)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
                            No drawdown data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
