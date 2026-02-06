
import React, { useState, useEffect } from 'react';
import { useToast } from '../shared/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Video, FileText, AlertTriangle, Brain, Disc, Trophy,
    CheckCircle, Lock, PlayCircle, Star, Search, ChevronRight,
    GraduationCap, Zap, Clock, ShieldAlert, BadgeInfo, Target
} from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { ACADEMY_CURRICULUM, AcademyModule, AcademyItem } from '../../data/AcademyContent';
import confetti from 'canvas-confetti';
import { InteractiveQuiz } from '../academy/InteractiveQuiz';

// --- Types ---
interface CompletedItems {
    [id: string]: boolean;
}

const Academy: React.FC = () => {
    const { toast } = useToast();
    const { xp, level, addXp } = useGamificationStore();
    const [selectedModuleId, setSelectedModuleId] = useState<string>(ACADEMY_CURRICULUM[0].id);
    const [completedItems, setCompletedItems] = useState<CompletedItems>(() => {
        const saved = localStorage.getItem('academy_completed_items');
        return saved ? JSON.parse(saved) : {};
    });

    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'lessons' | 'quiz'>('lessons');

    // Persist progress
    useEffect(() => {
        localStorage.setItem('academy_completed_items', JSON.stringify(completedItems));
    }, [completedItems]);

    const activeModule = ACADEMY_CURRICULUM.find(m => m.id === selectedModuleId) || ACADEMY_CURRICULUM[0];

    // Calculate Progress
    const getModuleProgress = (moduleId: string) => {
        const module = ACADEMY_CURRICULUM.find(m => m.id === moduleId);
        if (!module) return 0;
        const total = module.items.length;
        const completed = module.items.filter(i => completedItems[i.id]).length;
        return (completed / total) * 100;
    };

    const handleCompleteItem = (item: AcademyItem) => {
        if (completedItems[item.id]) return;

        setCompletedItems(prev => ({
            ...prev,
            [item.id]: true
        }));

        addXp(item.xpReward);
        triggerConfetti();
        toast.success(`Lesson Completed! +${item.xpReward} XP`);
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#f43f5e', '#fbbf24'],
            disableForReducedMotion: true
        });
    };

    // --- Render Helpers ---

    const renderItemIcon = (type: string, isCompleted: boolean) => {
        const colorClass = isCompleted ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500';

        switch (type) {
            case 'VIDEO': return <Video size={20} className={colorClass} />;
            case 'BOOK': return <Book size={20} className={colorClass} />;
            case 'ARTICLE': return <FileText size={20} className={colorClass} />;
            case 'TERM': return <BadgeInfo size={20} className={colorClass} />;
            case 'NORM': return <ShieldAlert size={20} className={colorClass} />;
            case 'ALERT': return <AlertTriangle size={20} className="text-rose-500" />;
            default: return <Book size={20} className={colorClass} />;
        }
    };

    const getItemColor = (type: string) => {
        switch (type) {
            case 'VIDEO': return 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'BOOK': return 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
            case 'ALERT': return 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
            default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative rounded-xl border border-slate-200 dark:border-slate-800">

            {/* LEFT SIDEBAR: CURRICULUM */}
            <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Wealth Academy</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Professional Series</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {ACADEMY_CURRICULUM.map((module) => {
                        const progress = getModuleProgress(module.id);
                        const isSelected = selectedModuleId === module.id;

                        return (
                            <button
                                key={module.id}
                                onClick={() => setSelectedModuleId(module.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all border relative overflow-hidden group ${isSelected
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg transform scale-[1.02]'
                                    : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h3 className={`font-bold text-sm ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {module.title.replace(':', ':\n')}
                                    </h3>
                                    {progress === 100 && <CheckCircle size={16} className="text-emerald-500" />}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isSelected ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isSelected ? 'bg-indigo-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Subtle background icon */}
                                <module.icon
                                    size={80}
                                    className={`absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}
                                />
                            </button>
                        );
                    })}
                </div>

                {/* Sidebar Footer: User Stats */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                    <div className="flex justify-between items-center bg-indigo-900 text-white p-3 rounded-lg shadow-inner">
                        <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-400" />
                            <span className="text-xs font-bold">Level {level}</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-200">{xp} XP</span>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-slate-200/50 via-transparent to-transparent dark:from-slate-900/50 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto p-8 md:p-12 relative z-10">

                    {/* View Toggle */}
                    <div className="flex items-center gap-3 mb-8">
                        <button
                            onClick={() => setActiveView('lessons')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeView === 'lessons'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <GraduationCap size={18} />
                            Lessons
                        </button>
                        <button
                            onClick={() => setActiveView('quiz')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeView === 'quiz'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Target size={18} />
                            Quiz Arena
                        </button>
                    </div>

                    {/* Quiz View */}
                    {activeView === 'quiz' ? (
                        <InteractiveQuiz />
                    ) : (
                        <div>
                            {/* Header */}
                            <div className="mb-10">
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">Module</span>
                                    <ChevronRight size={12} />
                                    <span>{activeModule.title}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                                    {activeModule.description}
                                </h1>
                            </div>

                            {/* Content List */}
                            <div className="space-y-6">
                                {activeModule.items.map((item, idx) => {
                                    const isCompleted = !!completedItems[item.id];
                                    const isHovered = hoveredItem === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            onMouseEnter={() => setHoveredItem(item.id)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-300 ${isCompleted
                                                ? 'border-emerald-500/30 shadow-sm opacity-80'
                                                : isHovered
                                                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.01] z-20'
                                                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                                                }`}
                                        >
                                            <div className="flex gap-6 items-start">

                                                {/* Status Indicator / Action */}
                                                <div className="shrink-0 pt-1">
                                                    <button
                                                        onClick={() => handleCompleteItem(item)}
                                                        disabled={isCompleted}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rotate-0 scale-100'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:scale-110'
                                                            }`}
                                                    >
                                                        {isCompleted ? <CheckCircle size={24} /> : <PlayCircle size={24} />}
                                                    </button>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getItemColor(item.type)}`}>
                                                            {item.type}
                                                        </span>
                                                        {item.duration && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <Clock size={10} /> {item.duration}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                                        }`}>
                                                        {item.title}
                                                    </h3>

                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                                        {item.description}
                                                    </p>

                                                    {item.url && !isCompleted && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 underline decoration-indigo-200 underline-offset-4"
                                                        >
                                                            Open Resource <ChevronRight size={12} />
                                                        </a>
                                                    )}
                                                </div>

                                                {/* XP Badge */}
                                                <div className="shrink-0 text-right">
                                                    <div className={`inline-flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed ${isCompleted
                                                        ? 'border-emerald-200 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800'
                                                        : 'border-indigo-100 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-800 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors'
                                                        }`}>
                                                        <span className="text-lg font-black">{item.xpReward}</span>
                                                        <span className="text-[10px] uppercase font-bold">XP</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Success Message Overlay */}
                                            {isCompleted && (
                                                <div className="absolute inset-x-0 bottom-0 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-center rounded-b-2xl border-t border-emerald-100 dark:border-emerald-800/30">
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                                        <Trophy size={10} /> Lesson Mastered
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(Academy);
