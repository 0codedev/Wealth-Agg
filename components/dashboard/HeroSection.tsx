import React, { useState } from 'react';
import { Milestone, Trash2 } from 'lucide-react';
import { LifeEvent } from '../../database';

interface HeroSectionProps {
    stats: any;
    isPrivacyMode: boolean;
    dynamicHealthScore: number;
    formatCurrency: (val: number) => string;
    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id'>) => Promise<void>;
    deleteLifeEvent: (id: number) => Promise<void>;
    showLiabilityProp?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
    stats, isPrivacyMode, dynamicHealthScore, formatCurrency,
    lifeEvents, addLifeEvent, deleteLifeEvent
}) => {
    const [showLiability, setShowLiability] = useState(false); // Default to Gross (False)
    const [newEventName, setNewEventName] = useState('');
    const [newEventAmount, setNewEventAmount] = useState('');
    const [newEventDate, setNewEventDate] = useState('');

    // Dynamic Health Score Calculation
    // If Net Worth (showLiability) is selected, score might drop due to liabilities
    const currentHealthScore = React.useMemo(() => {
        if (!showLiability) return dynamicHealthScore; // Gross = Base Score

        // Simple penalty logic for Net Worth view if liabilities exist
        const ratio = stats.totalCurrent / stats.totalAssets; // Net / Gross
        const penalty = ratio < 0.5 ? 20 : ratio < 0.8 ? 10 : 0;
        return Math.max(0, dynamicHealthScore - penalty);
    }, [showLiability, dynamicHealthScore, stats]);

    const healthColor = currentHealthScore > 75 ? 'text-emerald-500' : currentHealthScore > 50 ? 'text-amber-500' : 'text-rose-500';

    const handleAddEvent = () => {
        if (!newEventName || !newEventAmount || !newEventDate) return;
        addLifeEvent({
            name: newEventName,
            amount: parseFloat(newEventAmount),
            date: newEventDate,
            type: 'EXPENSE'
        });
        setNewEventName('');
        setNewEventAmount('');
        setNewEventDate('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-8 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{showLiability ? 'Real-Time Net Worth' : 'Gross Asset Value'}</p>
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <button onClick={() => setShowLiability(false)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!showLiability ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Gross</button>
                            <button onClick={() => setShowLiability(true)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${showLiability ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Net</button>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">{isPrivacyMode ? '••••••' : formatCurrency(showLiability ? (stats?.totalCurrent || 0) : (stats?.totalAssets || 0))}</h1>
                    </div>
                    <div className="mt-8 grid grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p><p className="text-slate-700 dark:text-slate-200 font-mono text-lg font-semibold tabular-nums">{isPrivacyMode ? '••••' : formatCurrency(stats.totalAssets)}</p></div>
                        <div className={`transition-opacity duration-300 ${!showLiability ? 'opacity-40 grayscale' : 'opacity-100'}`}><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Liabilities</p><p className="text-rose-500 font-mono text-lg font-semibold tabular-nums">-{isPrivacyMode ? '••••' : formatCurrency(stats.totalLiability)}</p></div>
                        <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Health Score</p><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24"><div className={`h-full ${currentHealthScore > 75 ? 'bg-emerald-500' : currentHealthScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${currentHealthScore}%` }}></div></div><span className={`font-mono text-sm font-bold ${healthColor}`}>{currentHealthScore}</span></div></div>
                    </div>
                </div>
            </div>

            {/* MILESTONE TIMELINE (Quick Add) */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide"><Milestone size={16} className="text-indigo-500" /> Milestone Timeline</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[120px]">
                    {lifeEvents.length === 0 && <p className="text-xs text-slate-400 italic">No future events logged.</p>}
                    {lifeEvents.map(evt => (
                        <div key={evt.id} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{evt.name}</p>
                                <p className="text-[10px] text-slate-500">{evt.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-rose-500">-{formatCurrency(evt.amount)}</span>
                                <button onClick={() => evt.id && deleteLifeEvent(evt.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Add Life Event</p>
                    <div className="space-y-2">
                        <input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="e.g. Wedding" className="w-full p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none" />
                        <div className="flex gap-2">
                            <input type="number" value={newEventAmount} onChange={e => setNewEventAmount(e.target.value)} placeholder="₹ Amount" className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none" />
                            <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none" />
                        </div>
                        <button onClick={handleAddEvent} className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700">Add Milestone</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
