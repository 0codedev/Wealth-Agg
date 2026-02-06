import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    LayoutDashboard, BookOpen, Library, Plus,
    Calendar as CalendarIcon, ShieldAlert, Snowflake, Grid, CheckSquare, X
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Trade, DailyReview, calculatePnL } from '../database';
import { calculateStreaks } from '../utils/helpers';

// Components
import JournalAnalytics from './journal/JournalAnalytics';
import JournalCalendarView from './journal/JournalCalendarView';
import PlaybookGallery from './journal/PlaybookGallery';
import AddTradeModal from './AddTradeModal';
import DailyReviewModal from './journal/DailyReviewModal';
import MistakesReflectorModal from './journal/MistakesReflectorModal';
import SlumpBusterModal from './journal/SlumpBusterModal';
import JournalCommandCenter from './journal/JournalCommandCenter';
import { AnimatedToggle } from './ui/AnimatedToggle';
import { PreTradeChecklist } from './journal/PreTradeChecklist';
import { WhatIfScenarioBuilder } from './journal/WhatIfScenarioBuilder';

type ViewMode = 'ANALYTICS' | 'JOURNAL' | 'PLAYBOOK';

const PsychDashboard: React.FC = () => {
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('ANALYTICS');
    const [timeframe, setTimeframe] = useState<'ALL' | '30D' | '90D'>('ALL');

    // Modal State
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
    const [isReflectorOpen, setIsReflectorOpen] = useState(false);
    const [isSlumpBusterOpen, setIsSlumpBusterOpen] = useState(false);

    // Checklist Sidebar State (New Feature)
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);

    // Edit Mode State
    const [selectedTradeToEdit, setSelectedTradeToEdit] = useState<Trade | null>(null);

    const handleEditTrade = (trade: Trade) => {
        setSelectedTradeToEdit(trade);
        setIsAddTradeOpen(true);
    };

    const handleCloseTradeModal = () => {
        setIsAddTradeOpen(false);
        setSelectedTradeToEdit(null);
    };

    // Filter Logic
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
    const [ignoredMistakes, setIgnoredMistakes] = useState<string[]>([]);

    // Data Fetching
    const rawTrades = useLiveQuery(() => db.trades.toArray()) || [];
    const dailyReviews = useLiveQuery(() => db.daily_reviews.toArray()) || [];

    // Enriched Trades (PnL & Risk)
    const trades = useMemo(() => {
        return rawTrades.map(t => {
            let r = t.riskRewardRatio || 0;
            if (!r && t.entryPrice && t.stopLoss && t.exitPrice) {
                const risk = Math.abs(t.entryPrice - t.stopLoss);
                if (risk > 0) {
                    const reward = t.direction === 'Long' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
                    r = reward / risk;
                }
            }
            return {
                ...t,
                pnl: calculatePnL(t),
                riskRewardRatio: r
            };
        });
    }, [rawTrades]);

    // Derived Logic
    const filteredTrades = useMemo(() => {
        if (viewMode === 'JOURNAL' && selectedCalendarDate) {
            return trades.filter(t => t.date === selectedCalendarDate);
        }
        if (timeframe === 'ALL' || viewMode !== 'ANALYTICS') return trades;

        const now = new Date();
        const days = timeframe === '30D' ? 30 : 90;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        return trades.filter(t => new Date(t.date) >= cutoff);
    }, [trades, timeframe, viewMode, selectedCalendarDate]);

    const selectedDayReview = useMemo(() => {
        return selectedCalendarDate
            ? dailyReviews.find(r => r.date === selectedCalendarDate) || null
            : null;
    }, [dailyReviews, selectedCalendarDate]);

    const slumpStats = useMemo(() => calculateStreaks(trades), [trades]);

    // Slump Buster Check
    useEffect(() => {
        if (slumpStats.currentLoseStreak >= 3) {
            setIsSlumpBusterOpen(true);
        }
    }, [slumpStats.currentLoseStreak]);

    return (
        // REFACTOR 1: Reduced Padding & Full Width
        <div className="min-h-screen text-slate-200 p-4 font-sans selection:bg-indigo-500/30">

            {/* 1. HEADER & CONTROLS */}
            <div className="w-full mb-6 flex flex-col xl:flex-row justify-between items-center gap-4">

                {/* Navigation Tabs */}
                <LayoutGroup>
                    <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner flex items-center gap-1 mx-auto xl:mx-0 overflow-x-auto max-w-full">
                        {[
                            { id: 'ANALYTICS', icon: LayoutDashboard, label: 'Analytics' },
                            { id: 'JOURNAL', icon: CalendarIcon, label: 'Journal' },
                            { id: 'PLAYBOOK', icon: Grid, label: 'Playbook' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setViewMode(tab.id as ViewMode)}
                                className={`relative px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors z-10 whitespace-nowrap ${viewMode === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {viewMode === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon size={16} className="relative z-10" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </LayoutGroup>

                {/* Right Side Controls */}
                <div className="flex flex-wrap items-center justify-center gap-3">

                    {/* Timeframe Toggles (Analytics Only) */}
                    {viewMode === 'ANALYTICS' && (
                        <div className="hidden sm:block mr-2">
                            <AnimatedToggle
                                items={[
                                    { id: 'ALL', label: 'ALL' },
                                    { id: '30D', label: '30D' },
                                    { id: '90D', label: '90D' }
                                ]}
                                activeId={timeframe}
                                onChange={(id) => setTimeframe(id as any)}
                                layoutId="analyticsTimeframe"
                                size="sm"
                            />
                        </div>
                    )}

                    {/* Streak Badge */}
                    {slumpStats.currentLoseStreak > 0 && (
                        <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold border border-rose-500/20 flex items-center gap-1 animate-pulse">
                            <Snowflake size={12} /> Streak: -{slumpStats.currentLoseStreak}
                        </div>
                    )}

                    {/* Mistake Reflector */}
                    <button
                        onClick={() => setIsReflectorOpen(true)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 transition-colors"
                        title="Reflect on Mistakes"
                    >
                        <ShieldAlert size={18} />
                    </button>

                    {/* REFACTOR 2: Checklist Toggle Button */}
                    <button
                        onClick={() => setIsChecklistOpen(true)}
                        className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold border border-emerald-500/20 flex items-center gap-2 transition-all"
                    >
                        <CheckSquare size={18} /> Checklist
                    </button>

                    {/* Add Trade Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAddTradeOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] flex items-center gap-2 border border-indigo-500/50 backdrop-blur-sm"
                    >
                        <Plus size={18} /> New Trade
                    </motion.button>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA - REFACTOR 3: Full Width Container */}
            <div className="w-full min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    {viewMode === 'ANALYTICS' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* REFACTOR 4: Removed Grid, using full width */}
                            <div className="w-full space-y-6">
                                <JournalAnalytics
                                    trades={trades}
                                    timeframe={timeframe}
                                    ignoredMistakes={ignoredMistakes}
                                    setIgnoredMistakes={setIgnoredMistakes}
                                />
                            </div>

                            {/* What-If Scenario Builder */}
                            <div className="mt-6">
                                <WhatIfScenarioBuilder />
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'JOURNAL' && (
                        <motion.div
                            key="journal"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <JournalCalendarView
                                trades={filteredTrades}
                                dailyReviews={dailyReviews}
                                selectedCalendarDate={selectedCalendarDate}
                                setSelectedCalendarDate={setSelectedCalendarDate}
                                selectedDayReview={selectedDayReview}
                                onOpenDailyReviewModal={() => setIsDailyReviewModalOpen(true)}
                                onTradeClick={handleEditTrade}
                            />
                        </motion.div>
                    )}

                    {viewMode === 'PLAYBOOK' && (
                        <motion.div
                            key="playbook"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PlaybookGallery trades={trades} onEditTrade={handleEditTrade} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. MODALS */}

            {/* REFACTOR 5: Checklist Drawer Modal */}
            <AnimatePresence>
                {isChecklistOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-pointer"
                            onClick={() => setIsChecklistOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-slate-950 border-l border-slate-800 z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                <span className="font-bold text-lg text-white flex items-center gap-2">
                                    <CheckSquare size={20} className="text-emerald-500" /> Pre-Trade Flight Check
                                </span>
                                <button
                                    onClick={() => setIsChecklistOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <PreTradeChecklist />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AddTradeModal
                isOpen={isAddTradeOpen}
                onClose={handleCloseTradeModal}
                onSave={() => { handleCloseTradeModal(); /* trigger reload if needed via liveQuery */ }}
                tradeToEdit={selectedTradeToEdit}
            />

            <DailyReviewModal
                isOpen={isDailyReviewModalOpen}
                onClose={() => setIsDailyReviewModalOpen(false)}
                date={selectedCalendarDate || new Date().toISOString().split('T')[0]}
                onSave={() => {/* Auto-updates via liveQuery */ }}
            />

            <MistakesReflectorModal
                isOpen={isReflectorOpen}
                onClose={() => setIsReflectorOpen(false)}
            />

            <SlumpBusterModal
                isOpen={isSlumpBusterOpen}
                onClose={() => setIsSlumpBusterOpen(false)}
                slumpStats={slumpStats}
            />

            {/* 4. COMMAND CENTER (Hidden until triggered) */}
            <JournalCommandCenter />

        </div>
    );
};

export default PsychDashboard;
