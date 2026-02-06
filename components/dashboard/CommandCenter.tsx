import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, TrendingUp, TrendingDown, Zap, Bell, Plus,
    Calculator, RefreshCw, Search, Command, Keyboard,
    BarChart3, PieChart, Wallet, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import RoutineClock from '../RoutineClock';
import { MarketStatus } from '../../hooks/useMarketSentiment';
import { logger } from '../../services/Logger';

interface CommandCenterProps {
    marketStatus: MarketStatus;
    marketVix: number;
    onQuickAction?: (action: string) => void;
}

// ===================== LIVE MARKET TICKER =====================
interface IndexData {
    name: string;
    value: number;
    change: number;
    changePercent: number;
}

const MarketTicker: React.FC = () => {
    const [indices, setIndices] = useState<IndexData[]>([
        { name: 'NIFTY 50', value: 23856.50, change: 127.85, changePercent: 0.54 },
        { name: 'SENSEX', value: 78699.07, change: 384.30, changePercent: 0.49 },
        { name: 'BANK NIFTY', value: 51234.15, change: -89.25, changePercent: -0.17 },
        { name: 'NIFTY IT', value: 41523.80, change: 256.40, changePercent: 0.62 },
    ]);

    // Simulate real-time updates (in production, would use WebSocket/API)
    useEffect(() => {
        const interval = setInterval(() => {
            setIndices(prev => prev.map(idx => {
                const randomChange = (Math.random() - 0.5) * 20;
                const newValue = idx.value + randomChange;
                const newChange = idx.change + randomChange;
                const newPercent = (newChange / (newValue - newChange)) * 100;
                return {
                    ...idx,
                    value: parseFloat(newValue.toFixed(2)),
                    change: parseFloat(newChange.toFixed(2)),
                    changePercent: parseFloat(newPercent.toFixed(2))
                };
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-1 overflow-hidden">
            <div className="flex animate-[scroll_30s_linear_infinite] gap-6 whitespace-nowrap">
                {[...indices, ...indices].map((idx, i) => (
                    <div key={`${idx.name}-${i}`} className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{idx.name}</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {idx.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {Math.abs(idx.changePercent).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===================== SMART ACTION CARDS =====================
interface SmartAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    priority: 'high' | 'medium' | 'low';
    action: string;
}

const SmartActionCard: React.FC<{ action: SmartAction; onExecute: (id: string) => void }> = ({ action, onExecute }) => {
    const priorityColors = {
        high: 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/20',
        medium: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20',
        low: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20'
    };

    const priorityBadge = {
        high: 'bg-rose-500 text-white',
        medium: 'bg-amber-500 text-white',
        low: 'bg-emerald-500 text-white'
    };

    return (
        <button
            onClick={() => onExecute(action.id)}
            className={`group p-3 rounded-xl border ${priorityColors[action.priority]} hover:scale-[1.02] transition-all duration-200 text-left w-full`}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{action.title}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${priorityBadge[action.priority]}`}>
                            {action.priority}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{action.description}</p>
                </div>
            </div>
        </button>
    );
};

// ===================== QUICK ACTIONS BAR =====================
interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut: string;
}

const QuickActionsBar: React.FC<{ onAction: (id: string) => void }> = ({ onAction }) => {
    const quickActions: QuickAction[] = [
        { id: 'add', label: 'Add Investment', icon: <Plus size={14} />, shortcut: 'N' },
        { id: 'calculate', label: 'Calculator', icon: <Calculator size={14} />, shortcut: 'C' },
        { id: 'refresh', label: 'Refresh', icon: <RefreshCw size={14} />, shortcut: 'R' },
        { id: 'search', label: 'Search', icon: <Search size={14} />, shortcut: '/' },
        { id: 'alerts', label: 'Alerts', icon: <Bell size={14} />, shortcut: 'A' },
    ];

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                const action = quickActions.find(a => a.shortcut.toLowerCase() === e.key.toLowerCase());
                if (action) {
                    e.preventDefault();
                    onAction(action.id);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onAction]);

    return (
        <div className="flex items-center gap-1">
            {quickActions.map(action => (
                <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    title={`${action.label} (Ctrl+${action.shortcut})`}
                >
                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {action.icon}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 hidden lg:block">
                        {action.label}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded hidden xl:block">
                        ⌘{action.shortcut}
                    </span>
                </button>
            ))}
        </div>
    );
};

// ===================== MAIN COMMAND CENTER =====================
const CommandCenter: React.FC<CommandCenterProps> = ({ marketStatus, marketVix, onQuickAction }) => {

    const isRed = marketStatus === 'RED';
    const statusColor = isRed ? 'text-rose-500' : marketStatus === 'AMBER' ? 'text-amber-500' : 'text-emerald-500';
    const statusBg = isRed ? 'bg-rose-500/10 border-rose-500/20' : marketStatus === 'AMBER' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

    const handleQuickAction = useCallback((actionId: string) => {
        logger.debug('Quick action triggered', { actionId }, 'CommandCenter');
        onQuickAction?.(actionId);
    }, [onQuickAction]);

    return (
        <div className="space-y-4 mb-8">
            {/* ROW 1: Live Market Ticker - DISABLED PER USER REQUEST */}
            {/* <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <BarChart3 size={14} className="text-indigo-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Market</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <QuickActionsBar onAction={handleQuickAction} />
                </div>
                <MarketTicker />
            </div> */}

            {/* ROW 2: Routine Clock + Market Status (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Routine Clock */}
                <div className="lg:col-span-6">
                    <RoutineClock />
                </div>

                {/* Market Status Card */}
                <div className={`lg:col-span-6 rounded-xl border p-6 flex flex-col justify-center relative overflow-hidden ${statusBg} transition-all duration-500`}>
                    {isRed && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />}

                    <div className="flex items-center justify-between relative z-10 h-full">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isRed ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : marketStatus === 'AMBER' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Market Sentiment</p>
                                <h3 className={`font-black text-2xl tracking-tight ${statusColor}`}>
                                    {isRed ? 'DEFENSIVE' : marketStatus === 'AMBER' ? 'CAUTIOUS' : 'OPTIMAL'}
                                </h3>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-white/50 dark:bg-black/20 rounded-lg mb-1 backdrop-blur-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase">India VIX</span>
                            </div>
                            <p className="text-3xl font-black text-slate-700 dark:text-white font-mono">
                                {marketVix.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandCenter;
