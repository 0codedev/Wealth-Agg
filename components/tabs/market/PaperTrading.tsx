
import React, { useState } from 'react';
import { TradeJournal } from './TradeJournal';
import { LiveSimulator } from './LiveSimulator';
import { MarketReplay } from './MarketReplay';
import {
    Activity, ClipboardList, MonitorPlay, Layers,
    ChevronRight, Info
} from 'lucide-react';

export const PaperTrading: React.FC = () => {
    // Mode State
    const [mode, setMode] = useState<'JOURNAL' | 'LIVE' | 'REPLAY'>('LIVE');

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">

            {/* Header / Mode Switcher */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-indigo-500/5">

                {/* Logo Area */}
                <div className="flex items-center gap-3 px-4">
                    <div className="bg-fuchsia-500/10 p-2 rounded-xl">
                        <Layers className="text-fuchsia-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">Paper Sandbox</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Risk-Free Environment</p>
                    </div>
                </div>

                {/* Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-stretch md:self-auto">
                    <button
                        onClick={() => setMode('LIVE')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'LIVE'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Activity size={16} /> Live Simulator
                    </button>
                    <button
                        onClick={() => setMode('REPLAY')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'REPLAY'
                            ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-md transform scale-105'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <MonitorPlay size={16} /> Market Replay
                    </button>
                    <button
                        onClick={() => setMode('JOURNAL')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'JOURNAL'
                            ? 'bg-white dark:bg-slate-700 text-fuchsia-500 shadow-md transform scale-105'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <ClipboardList size={16} /> Trade Journal
                    </button>
                </div>
            </div>

            {/* Context Info Banner */}
            {mode === 'LIVE' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Pro Simulator Active:</strong> This mode simulates live market data with synthesized price action.
                        It allows you to practice technical analysis, use indicators (EMA, RSI), and test execution speeds without waiting for market hours.
                    </p>
                </div>
            )}
            {mode === 'REPLAY' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30 text-cyan-800 dark:text-cyan-200 text-sm">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Replay Mode:</strong> Re-live historical market sessions candle-by-candle.
                        Great for backtesting specific setups and training your eye to recognize patterns in accelerated time.
                    </p>
                </div>
            )}

            {/* Main Content Area */}
            <div className="min-h-[600px]">
                {mode === 'LIVE' && <LiveSimulator />}
                {mode === 'REPLAY' && <MarketReplay isOpen={true} />}
                {mode === 'JOURNAL' && <TradeJournal />}
            </div>

        </div>
    );
};
