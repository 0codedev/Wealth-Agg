
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingDown, BookOpen, Plus, Trash2, DollarSign, Brain, Target, ShieldAlert, Pencil } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { useToast } from '../shared/ToastProvider';

interface Mistake {
    id: string;
    date: string;
    title: string;
    cost: number;
    category: 'TRADING' | 'LIFE';
    lesson: string;
    emotionalState?: string;
}

interface MistakesReflectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MistakesReflectorModal: React.FC<MistakesReflectorModalProps> = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [view, setView] = useState<'LIST' | 'new'>('LIST');

    // Form State
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');
    const [category, setCategory] = useState<'TRADING' | 'LIFE'>('TRADING');
    const [lesson, setLesson] = useState('');
    const [emotionalState, setEmotionalState] = useState('');
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadMistakes();
        }
    }, [isOpen]);

    const loadMistakes = () => {
        const saved = localStorage.getItem('financial_mistakes');
        if (saved) {
            try {
                setMistakes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load mistakes", e);
            }
        }
    };

    const saveMistakes = (newMistakes: Mistake[]) => {
        localStorage.setItem('financial_mistakes', JSON.stringify(newMistakes));
        setMistakes(newMistakes);
    };

    const handleSubmit = () => {
        if (!title || !cost || !lesson) {
            toast.warning("Please fill in all required fields.");
            return;
        }

        const mistakeData: Mistake = {
            id: editId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: editId ? mistakes.find(m => m.id === editId)?.date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            title,
            cost: parseFloat(cost),
            category,
            lesson,
            emotionalState
        };

        if (editId) {
            // Update existing
            const updated = mistakes.map(m => m.id === editId ? mistakeData : m);
            saveMistakes(updated);
            toast.success("Reflection updated.");
        } else {
            // Create new
            const updated = [mistakeData, ...mistakes];
            saveMistakes(updated);
            toast.success("Reflection logged. Pain is the best teacher.");
        }

        resetForm();
        setView('LIST');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        console.log("Deleting mistake:", id);
        if (window.confirm('Forget this mistake? (Not recommended unless erroneous entry)')) {
            const updated = mistakes.filter(m => m.id !== id);
            saveMistakes(updated);
            toast.success("Mistake deleted.");
        }
    };

    const handleEdit = (mistake: Mistake) => {
        setTitle(mistake.title);
        setCost(mistake.cost.toString());
        setCategory(mistake.category);
        setLesson(mistake.lesson);
        setEmotionalState(mistake.emotionalState || '');
        setEditId(mistake.id);
        setView('new');
    };

    const resetForm = () => {
        setTitle('');
        setCost('');
        setCategory('TRADING');
        setLesson('');
        setEmotionalState('');
        setEditId(null);
    };

    const totalCost = mistakes.reduce((acc, m) => acc + m.cost, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldAlert className="text-rose-500" /> Mirror of Truth
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mistakes & Learnings Reflector</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-black/20">

                    {view === 'LIST' ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-rose-500 text-white p-6 rounded-2xl shadow-lg shadow-rose-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-20 transform rotate-12">
                                    <TrendingDown size={80} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">Total Tuition Paid</p>
                                    <h3 className="text-4xl font-black">{formatCurrency(totalCost)}</h3>
                                    <p className="text-sm mt-2 opacity-90 max-w-sm">
                                        "Experience is simply the name we give our mistakes." - Oscar Wilde
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <BookOpen size={18} /> Lesson Archive
                                </h3>
                                <button
                                    onClick={() => setView('new')}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    <Plus size={16} /> Log New Mistake
                                </button>
                            </div>

                            {/* List */}
                            {mistakes.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    <Brain size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No mistakes logged yet.</p>
                                    <p className="text-xs text-slate-400">Either you are perfect, or you are not being honest.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {mistakes.map(mistake => (
                                        <div key={mistake.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mistake.category === 'TRADING' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                                        {mistake.category}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{mistake.date}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(mistake);
                                                        }}
                                                        className="p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors relative z-20"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, mistake.id)}
                                                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors relative z-20"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{mistake.title}</h4>
                                                    <p className="text-rose-500 font-mono font-bold text-sm">-{formatCurrency(mistake.cost)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-4 border-emerald-500">
                                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Lesson Learned</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{mistake.lesson}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ADD FORM */
                        <div className="animate-in slide-in-from-right-4 space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <button onClick={() => setView('LIST')} className="text-sm text-slate-500 hover:text-indigo-500 font-bold">
                                    &larr; Back to List
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Describe Result</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. FOMO into high volatility stock"
                                    className="w-full bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-rose-500 transition-colors font-bold text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Financial Loss</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            value={cost}
                                            onChange={e => setCost(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-100 dark:bg-slate-950 p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-rose-500 transition-colors font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                                        <button
                                            onClick={() => setCategory('TRADING')}
                                            className={`rounded-lg py-2 text-xs font-bold transition-all ${category === 'TRADING' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            <Target size={14} className="inline mr-1" /> Trade
                                        </button>
                                        <button
                                            onClick={() => setCategory('LIFE')}
                                            className={`rounded-lg py-2 text-xs font-bold transition-all ${category === 'LIFE' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            <TrendingDown size={14} className="inline mr-1" /> Life
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emotional Context (Optional)</label>
                                <input
                                    value={emotionalState}
                                    onChange={e => setEmotionalState(e.target.value)}
                                    placeholder="e.g. Greedy, Tired, Euphoric, Desperate"
                                    className="w-full bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-colors text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                                    <Brain size={14} /> The Gold: What did you learn?
                                </label>
                                <textarea
                                    value={lesson}
                                    onChange={e => setLesson(e.target.value)}
                                    placeholder="Reflect deeply. How will you prevent this next time?"
                                    className="w-full bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 outline-none focus:border-emerald-500 transition-colors min-h-[120px] resize-none text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {editId ? 'Update Reflection' : 'Commit to Memory'}
                            </button>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MistakesReflectorModal;
