import React, { useMemo } from 'react';
import { Crosshair, Target, Ghost } from 'lucide-react';
import { Trade } from '../../../database';
import { formatCurrency } from '../../../utils/helpers';

interface EdgeMatrixProps {
    trades: Trade[];
}

export const EdgeMatrix: React.FC<EdgeMatrixProps> = ({ trades }) => {
    const edgeData = useMemo(() => {
        const map: Record<string, { wins: number, loss: number, totalPnL: number, count: number }> = {};
        trades.forEach(t => {
            const setup = t.setup || 'No Setup';
            if (!map[setup]) map[setup] = { wins: 0, loss: 0, totalPnL: 0, count: 0 };
            map[setup].count++;
            map[setup].totalPnL += (t.pnl || 0);
            if ((t.pnl || 0) > 0) map[setup].wins++;
            else map[setup].loss++;
        });
        return Object.entries(map)
            .map(([name, data]) => ({
                name,
                winRate: (data.wins / data.count) * 100,
                avgPnL: data.totalPnL / data.count,
                totalPnL: data.totalPnL,
                count: data.count,
                profitFactor: Math.abs(data.wins / (data.loss || 1))
            }))
            .sort((a, b) => b.totalPnL - a.totalPnL);
    }, [trades]);

    return (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-md">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crosshair className="text-cyan-400" /> The Edge Finder
                    </h3>
                    <p className="text-sm text-slate-400">Correlation Matrix: Strategy vs. Performance</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-500 uppercase font-bold text-xs tracking-wider">
                        <tr>
                            <th className="p-4">Strategy / Setup</th>
                            <th className="p-4 text-center">Count</th>
                            <th className="p-4 text-center">Win Rate</th>
                            <th className="p-4 text-right">Avg PnL</th>
                            <th className="p-4 text-right">Total Net</th>
                            <th className="p-4 text-center">Rating</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-900/40 backdrop-blur-sm">
                        {edgeData.map((edge) => {
                            const isA_Plus = edge.winRate > 50 && edge.totalPnL > 0;
                            const isBleeding = edge.totalPnL < 0;
                            return (
                                <tr key={edge.name} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                        {isA_Plus && <Target size={14} className="text-emerald-500" />}
                                        {isBleeding && <Ghost size={14} className="text-rose-500" />}
                                        {edge.name}
                                    </td>
                                    <td className="p-4 text-center text-slate-400">{edge.count}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${edge.winRate > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${edge.winRate}%` }}></div>
                                            </div>
                                            <span className={`text-xs font-mono ${edge.winRate > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{edge.winRate.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className={`p-4 text-right font-mono ${edge.avgPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(edge.avgPnL)}</td>
                                    <td className={`p-4 text-right font-mono font-bold text-base ${edge.totalPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{edge.totalPnL > 0 ? '+' : ''}{formatCurrency(edge.totalPnL)}</td>
                                    <td className="p-4 text-center">
                                        {isA_Plus ? <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">A+</span> : isBleeding ? <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs font-bold">F</span> : <span className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs font-bold">C</span>}
                                    </td>
                                </tr>
                            );
                        })}
                        {edgeData.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Log more trades to unlock your Edge Matrix.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
