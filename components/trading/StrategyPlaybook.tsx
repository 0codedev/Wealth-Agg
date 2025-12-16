import React, { useState, useEffect } from 'react';
import { db, Trade } from '../../database';
import {
    BookOpen, Plus, Edit2, Trash2, Target, AlertTriangle,
    TrendingUp, TrendingDown, CheckCircle, XCircle, ChevronRight
} from 'lucide-react';

interface PlaybookEntry {
    id: string;
    name: string;
    description: string;
    rules: string[];
    winRate: number;
    avgRMultiple: number;
    totalTrades: number;
    isActive: boolean;
}

interface StrategyPlaybookProps {
    onSelectStrategy?: (strategy: PlaybookEntry) => void;
}

export const StrategyPlaybook: React.FC<StrategyPlaybookProps> = ({ onSelectStrategy }) => {
    const [strategies, setStrategies] = useState<PlaybookEntry[]>([
        {
            id: '1',
            name: 'Breakout Hunter',
            description: 'Trade breakouts from consolidation zones with volume confirmation',
            rules: [
                'Wait for at least 5 candles of consolidation',
                'Volume must be 1.5x average on breakout',
                'Risk maximum 1% per trade',
                'Target 2R minimum'
            ],
            winRate: 62,
            avgRMultiple: 1.8,
            totalTrades: 45,
            isActive: true
        },
        {
            id: '2',
            name: 'Gap & Go',
            description: 'Trade morning gaps with momentum follow-through',
            rules: [
                'Gap must be > 3%',
                'Wait for first 5-min pullback',
                'Entry on break of pullback high',
                'Stop below pullback low'
            ],
            winRate: 55,
            avgRMultiple: 2.1,
            totalTrades: 28,
            isActive: true
        },
        {
            id: '3',
            name: 'Mean Reversion',
            description: 'Fade extreme moves with RSI divergence',
            rules: [
                'RSI below 30 or above 70',
                'Look for divergence on lower timeframe',
                'Scale in 3 parts',
                'Take profit at 50 MA'
            ],
            winRate: 58,
            avgRMultiple: 1.5,
            totalTrades: 31,
            isActive: false
        }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newStrategy, setNewStrategy] = useState({ name: '', description: '', rules: '' });

    const handleAddStrategy = () => {
        if (newStrategy.name && newStrategy.description) {
            setStrategies([
                ...strategies,
                {
                    id: crypto.randomUUID(),
                    name: newStrategy.name,
                    description: newStrategy.description,
                    rules: newStrategy.rules.split('\n').filter(r => r.trim()),
                    winRate: 0,
                    avgRMultiple: 0,
                    totalTrades: 0,
                    isActive: true
                }
            ]);
            setNewStrategy({ name: '', description: '', rules: '' });
            setIsAdding(false);
        }
    };

    const toggleActive = (id: string) => {
        setStrategies(strategies.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    };

    const deleteStrategy = (id: string) => {
        setStrategies(strategies.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                        <BookOpen size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Strategy Playbook</h2>
                        <p className="text-sm text-slate-500">Your trading strategies and rules</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> New Strategy
                </button>
            </div>

            {/* Add Strategy Form */}
            {isAdding && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Add New Strategy</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Strategy Name"
                            value={newStrategy.name}
                            onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <textarea
                            placeholder="Description"
                            value={newStrategy.description}
                            onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-20"
                        />
                        <textarea
                            placeholder="Rules (one per line)"
                            value={newStrategy.rules}
                            onChange={(e) => setNewStrategy({ ...newStrategy, rules: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-32"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddStrategy}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium"
                            >
                                Save Strategy
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategies List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategies.map(strategy => (
                    <div
                        key={strategy.id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 transition-all cursor-pointer group ${strategy.isActive
                                ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                                : 'border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                        onClick={() => onSelectStrategy?.(strategy)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {strategy.name}
                                    {strategy.isActive && (
                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                                            Active
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{strategy.description}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleActive(strategy.id); }}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    {strategy.isActive ? <XCircle size={16} className="text-slate-400" /> : <CheckCircle size={16} className="text-emerald-500" />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteStrategy(strategy.id); }}
                                    className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-rose-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                                <p className={`text-sm font-bold ${strategy.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {strategy.winRate}%
                                </p>
                                <p className="text-[10px] text-slate-500">Win Rate</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    {strategy.avgRMultiple}R
                                </p>
                                <p className="text-[10px] text-slate-500">Avg R</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {strategy.totalTrades}
                                </p>
                                <p className="text-[10px] text-slate-500">Trades</p>
                            </div>
                        </div>

                        {/* Rules Preview */}
                        <div className="space-y-1">
                            {strategy.rules.slice(0, 2).map((rule, idx) => (
                                <p key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                                    <Target size={10} className="text-indigo-500" /> {rule}
                                </p>
                            ))}
                            {strategy.rules.length > 2 && (
                                <p className="text-xs text-indigo-500 flex items-center gap-1">
                                    <ChevronRight size={10} /> +{strategy.rules.length - 2} more rules
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategyPlaybook;
