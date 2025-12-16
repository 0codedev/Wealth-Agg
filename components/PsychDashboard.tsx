import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    LayoutDashboard, BookOpen, Library, Plus,
    Calendar as CalendarIcon, ShieldAlert, Snowflake, Grid
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Trade, DailyReview, calculatePnL } from '../database';
import { calculateStreaks } from '../utils/helpers';

// Components
import JournalAnalytics from './journal/JournalAnalytics';
import JournalCalendarView from './journal/JournalCalendarView';
import PlaybookGallery from './journal/PlaybookGallery';
import AddTradeModal from './AddTradeModal';
import DailyReviewModal from './journal/DailyReviewModal'; // Correct path
import MistakesReflectorModal from './journal/MistakesReflectorModal';
import SlumpBusterModal from './journal/SlumpBusterModal';
import JournalCommandCenter from './journal/JournalCommandCenter'; // New Component
import { AnimatedToggle } from './ui/AnimatedToggle';

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
        <div className="min-h-screen text-slate-200 p-6 sm:p-8 font-sans selection:bg-indigo-500/30">

            {/* 1. HEADER & CONTROLS */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Navigation Tabs */}
                <LayoutGroup>
                    <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner flex items-center gap-1">
                        {[
                            { id: 'ANALYTICS', icon: LayoutDashboard, label: 'Analytics' },
                            { id: 'JOURNAL', icon: CalendarIcon, label: 'Journal' },
                            { id: 'PLAYBOOK', icon: Grid, label: 'Playbook' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setViewMode(tab.id as ViewMode)}
                                className={`relative px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors z-10 ${viewMode === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
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
                <div className="flex items-center gap-3">

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

            {/* 2. MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    {viewMode === 'ANALYTICS' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <JournalAnalytics
                                trades={trades}
                                timeframe={timeframe}
                                ignoredMistakes={ignoredMistakes}
                                setIgnoredMistakes={setIgnoredMistakes}
                            />
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
                            <PlaybookGallery trades={trades} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. MODALS */}
            <AddTradeModal
                isOpen={isAddTradeOpen}
                onClose={() => setIsAddTradeOpen(false)}
                onSave={() => { setIsAddTradeOpen(false); /* trigger reload if needed via liveQuery */ }}
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
