import React, { useState } from 'react';
import { PieChart, Wallet, Bell, Zap, ArrowRight, Check } from 'lucide-react';

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
            className={`group p-3 rounded-xl border ${priorityColors[action.priority]} hover:scale-[1.02] transition-all duration-200 text-left w-full relative overflow-hidden`}
        >
            <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{action.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${priorityBadge[action.priority]}`}>
                            {action.priority}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{action.description}</p>
                </div>
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 -translate-x-2 group-hover:translate-x-0 transform duration-200">
                    <ArrowRight size={16} />
                </div>
            </div>
        </button>
    );
};

const SmartActionsWidget: React.FC<SmartActionsWidgetProps> = ({ onQuickAction }) => {
    const [smartActions] = useState<SmartAction[]>([
        {
            id: 'rebalance',
            title: 'Rebalance Portfolio',
            description: 'Your equity allocation is 5% above target',
            icon: <PieChart size={18} className="text-amber-600" />,
            priority: 'medium',
            action: 'rebalance'
        },
        {
            id: 'tax-harvest',
            title: 'Tax Harvesting Alert',
            description: '₹12,500 in unrealized losses available',
            icon: <Wallet size={18} className="text-rose-600" />,
            priority: 'high',
            action: 'tax-harvest'
        },
        {
            id: 'sip-due',
            title: 'SIP Due Tomorrow',
            description: '3 SIPs totaling ₹25,000',
            icon: <Bell size={18} className="text-indigo-600" />,
            priority: 'low',
            action: 'sip-reminder'
        },
    ]);

    const handleSmartAction = (actionId: string) => {
        console.log('Smart action:', actionId);
        onQuickAction?.(actionId);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-500">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Smart Actions</h3>
                        <p className="text-xs text-slate-500">AI-driven recommendations</p>
                    </div>
                </div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                    {smartActions.length} Pending
                </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {smartActions.length > 0 ? (
                    smartActions.map(action => (
                        <SmartActionCard key={action.id} action={action} onExecute={handleSmartAction} />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Check size={32} className="mb-2 text-emerald-500" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs">No pending actions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartActionsWidget;
