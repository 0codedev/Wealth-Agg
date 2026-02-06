import React, { useState } from 'react';
import { PieChart, Wallet, Bell, Zap, ArrowRight, Check, Command, Sparkles } from 'lucide-react';

interface SmartAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    priority: 'high' | 'medium' | 'low';
    action: string;
}

interface SmartActionsWidgetProps {
    onQuickAction?: (action: string) => void;
}

const SmartActionCard: React.FC<{ action: SmartAction; onExecute: (id: string) => void }> = ({ action, onExecute }) => {
    const priorityConfig = {
        high: { color: 'text-rose-500', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
        medium: { color: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
        low: { color: 'text-indigo-500', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' }
    };

    const config = priorityConfig[action.priority];

    return (
        <div className="group relative">
            <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
            <button
                onClick={() => onExecute(action.id)}
                className={`w-full relative flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all active:scale-[0.98] text-left overflow-hidden`}
            >
                {/* Priority Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg} ${config.color}`} />

                <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{action.title}</span>
                        {action.priority === 'high' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{action.description}</p>
                </div>

                <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all">
                    <ArrowRight size={10} className="-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </div>
            </button>
        </div>
    );
};

const SmartActionsWidget: React.FC<SmartActionsWidgetProps> = ({ onQuickAction }) => {
    const [smartActions, setSmartActions] = useState<SmartAction[]>([
        {
            id: 'rebalance',
            title: 'Rebalance Portfolio',
            description: 'Equity allocation +5% vs Target',
            icon: <PieChart size={16} className="text-amber-500" />,
            priority: 'medium',
            action: 'rebalance'
        },
        {
            id: 'tax-harvest',
            title: 'Harvest Tax Loss',
            description: 'Can offset ₹12.5k gains',
            icon: <Wallet size={16} className="text-rose-500" />,
            priority: 'high',
            action: 'tax-harvest'
        },
        {
            id: 'sip-due',
            title: 'Authorize SIPs',
            description: '₹25,000 due tomorrow',
            icon: <Bell size={16} className="text-indigo-500" />,
            priority: 'low',
            action: 'sip-reminder'
        },
    ]);

    const handleSmartAction = (actionId: string) => {
        // Simulate execution visual
        setSmartActions(prev => prev.filter(p => p.id !== actionId));
        onQuickAction?.(actionId);
    };

    return (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-900/10">
                        <Command size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Command</h3>
                        <p className="text-[10px] text-indigo-400/80 font-mono">Action Deck</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                    <Sparkles size={10} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-400">{smartActions.length} Pending</span>
                </div>
            </div>

            {/* Actions List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none relative z-10">
                {smartActions.length > 0 ? (
                    smartActions.map(action => (
                        <SmartActionCard key={action.id} action={action} onExecute={handleSmartAction} />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                            <Check size={32} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">All Clear</p>
                            <p className="text-xs text-slate-500">Zero pending actions.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Background Decor */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
};

export default SmartActionsWidget;
