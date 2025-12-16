
import React from 'react';
import { Trade } from '../../database';
import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, TrendingDown, MoreHorizontal, Calendar, Target, Brain } from 'lucide-react';

interface TradeHistoryTableProps {
    trades: Trade[];
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades }) => {
    if (trades.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                No trade data available for this view.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Symbol</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Setup</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Price</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">P&L</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Psych</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {trades.map((trade) => {
                            const isWin = (trade.pnl || 0) >= 0;
                            return (
                                <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Calendar size={14} className="text-slate-400" />
                                            {trade.date}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${trade.direction === 'Long' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                                {trade.direction === 'Long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">{trade.ticker}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            <Target size={12} />
                                            {trade.setup || 'Discretionary'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                                        {trade.quantity}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="text-xs text-slate-400">En: {trade.entryPrice}</div>
                                        <div className="text-xs text-slate-400">Ex: {trade.exitPrice}</div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className={`font-mono font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {isWin ? '+' : ''}{formatCurrency(trade.pnl || 0)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                <Brain size={10} /> {trade.moodEntry}
                                            </span>
                                            {trade.mistakes && trade.mistakes.length > 0 && (
                                                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-[10px] font-bold">
                                                    {trade.mistakes.length} Errors
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeHistoryTable;
