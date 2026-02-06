import React, { useState, useEffect, useMemo } from 'react';
import { db, Trade, calculatePnL } from '../../database';
import {
    ClipboardList, Plus, Filter, Search, TrendingUp, TrendingDown,
    Calendar, Clock, Tag, MoreVertical, Eye, Trash2, Edit2
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

import { useTradingJournalStore } from '../../store/tradingJournalStore';

interface TradeJournalProps {
    onAddTrade?: () => void;
    onEditTrade?: (trade: Trade) => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ onAddTrade, onEditTrade }) => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Use Store for persisted preferences
    const {
        filterType, setFilterType,
        sortBy, setSortBy
    } = useTradingJournalStore();

    useEffect(() => {
        const loadTrades = async () => {
            const allTrades = await db.trades.orderBy('date').reverse().toArray();
            setTrades(allTrades);
        };
        loadTrades();
    }, []);

    const stats = useMemo(() => {
        const wins = trades.filter(t => calculatePnL(t) > 0);
        const losses = trades.filter(t => calculatePnL(t) < 0);
        const totalPnL = trades.reduce((sum, t) => sum + calculatePnL(t), 0);
        const winRate = trades.length > 0 ? (wins.length / trades.length * 100) : 0;

        return {
            total: trades.length,
            wins: wins.length,
            losses: losses.length,
            totalPnL,
            winRate
        };
    }, [trades]);

    const filteredTrades = useMemo(() => {
        return trades
            .filter(t => {
                if (filterType === 'WIN') return calculatePnL(t) > 0;
                if (filterType === 'LOSS') return calculatePnL(t) < 0;
                return true;
            })
            .filter(t =>
                t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.setup?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === 'pnl') return calculatePnL(b) - calculatePnL(a);
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [trades, filterType, searchTerm, sortBy]);

    const handleDelete = async (id: number) => {
        await db.trades.delete(id);
        setTrades(trades.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                            <ClipboardList size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trade Journal</h2>
                            <p className="text-sm text-slate-500">Log and analyze your trades</p>
                        </div>
                    </div>
                    <button
                        onClick={onAddTrade}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Log Trade
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total Trades</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                        <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
                        </p>
                        <p className="text-xs text-slate-500">Total P&L</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                        <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {stats.winRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-500">Win Rate</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.wins}</p>
                        <p className="text-xs text-slate-500">Open Trades</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by symbol or strategy..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm"
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['ALL', 'WIN', 'LOSS'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === type
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trades List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredTrades.length === 0 ? (
                    <div className="text-center py-12">
                        <ClipboardList size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 font-medium">No trades found</p>
                        <p className="text-sm text-slate-400">Start logging your trades to track performance</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTrades.map(trade => {
                            const pnl = calculatePnL(trade);
                            const isWin = pnl > 0;

                            return (
                                <div
                                    key={trade.id}
                                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWin ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'
                                                }`}>
                                                {isWin ? (
                                                    <TrendingUp size={20} className="text-emerald-500" />
                                                ) : (
                                                    <TrendingDown size={20} className="text-rose-500" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {trade.ticker}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${trade.direction === 'Long'
                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                        : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                                        }`}>
                                                        {trade.direction}
                                                    </span>
                                                    {trade.setup && (
                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                                            {trade.setup}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <Calendar size={12} /> {new Date(trade.date).toLocaleDateString()}
                                                    <Clock size={12} className="ml-2" /> {trade.quantity} shares
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`font-bold ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isWin ? '+' : ''}{formatCurrency(pnl)}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Entry: {formatCurrency(trade.entryPrice)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEditTrade?.(trade)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                >
                                                    <Edit2 size={14} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => trade.id && handleDelete(trade.id)}
                                                    className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg"
                                                >
                                                    <Trash2 size={14} className="text-rose-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradeJournal;
