import React from 'react';
import { Brain, Snowflake, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { Trade } from '../../database';

interface SlumpBusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    slumpStats: {
        currentLoseStreak: number;
        bestTrade: Trade | null;
    };
}

const SlumpBusterModal: React.FC<SlumpBusterModalProps> = ({ isOpen, onClose, slumpStats }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_100px_rgba(225,29,72,0.5)]">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Snowflake size={120} className="text-rose-500 animate-spin-slow" />
                </div>

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/40">
                        <Brain size={40} className="text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Protocol Active</h2>
                    <p className="text-rose-400 font-bold text-sm mb-6 uppercase tracking-widest">3-Day Losing Streak Detected</p>

                    <p className="text-slate-300 mb-8 leading-relaxed">
                        Trading is currently locked. To break the cycle, you must reconnect with your best performance.
                    </p>

                    {slumpStats.bestTrade ? (
                        <div className="bg-slate-800 rounded-xl p-4 border border-emerald-500/30 mb-8 text-left">
                            <p className="text-[10px] text-emerald-400 uppercase font-bold mb-2 flex items-center gap-1">
                                <Target size={12} /> Your Best Trade
                            </p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xl font-black text-white">{slumpStats.bestTrade.ticker}</p>
                                    <p className="text-xs text-slate-400">{slumpStats.bestTrade.setup}</p>
                                </div>
                                <p className="text-2xl font-mono font-bold text-emerald-400">+{formatCurrency(slumpStats.bestTrade.pnl || 0)}</p>
                            </div>
                            {slumpStats.bestTrade.notes && (
                                <p className="mt-3 text-xs text-slate-300 italic border-t border-slate-700 pt-2">
                                    "{slumpStats.bestTrade.notes}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic mb-8">No wins recorded yet. Visualize your first win.</p>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                    >
                        I HAVE REVIEWED MY EDGE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlumpBusterModal;
