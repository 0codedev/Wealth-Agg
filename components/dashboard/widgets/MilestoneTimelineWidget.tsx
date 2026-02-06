import React, { useState } from 'react';
import { Milestone, Trash2, Signpost, Plus } from 'lucide-react';
import { LifeEvent } from '../../../database';
import { formatCurrency } from '../../../utils/helpers';

interface MilestoneTimelineWidgetProps {
    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id'>) => Promise<void>;
    deleteLifeEvent: (id: number) => Promise<void>;
}

const MilestoneTimelineWidget: React.FC<MilestoneTimelineWidgetProps> = ({
    lifeEvents, addLifeEvent, deleteLifeEvent
}) => {
    const [newEventName, setNewEventName] = useState('');
    const [newEventAmount, setNewEventAmount] = useState('');
    const [newEventDate, setNewEventDate] = useState('');

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
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Signpost size={16} className="text-indigo-400" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Milestone Timeline</h3>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 min-h-[150px]">
                {lifeEvents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <Signpost size={48} className="text-slate-600 mb-3" />
                        <p className="text-sm font-bold text-slate-400 italic">No future events logged.</p>
                        <p className="text-xs text-slate-600">Add weddings, vacations, or big purchases</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lifeEvents.map((evt) => (
                            <div key={evt.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-white">{evt.name}</p>
                                    <p className="text-xs text-slate-500">{new Date(evt.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono font-bold text-rose-400">-{formatCurrency(evt.amount)}</span>
                                    <button
                                        onClick={() => evt.id && deleteLifeEvent(evt.id)}
                                        className="text-slate-600 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Event Form */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Add Life Event</p>
                <div className="space-y-3">
                    <input
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                        placeholder="e.g. Wedding, Vacation, Car"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                    />
                    <div className="flex gap-3">
                        <input
                            type="number"
                            value={newEventAmount}
                            onChange={e => setNewEventAmount(e.target.value)}
                            placeholder="₹ Amount"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                        />
                        <input
                            type="date"
                            value={newEventDate}
                            onChange={e => setNewEventDate(e.target.value)}
                            className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleAddEvent}
                        disabled={!newEventName || !newEventAmount || !newEventDate}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        Add Milestone
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MilestoneTimelineWidget;
