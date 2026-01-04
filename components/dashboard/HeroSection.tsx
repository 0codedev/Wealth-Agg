import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Milestone, Trash2, TrendingUp, Shield, Target, Droplets, Sparkles, PartyPopper } from 'lucide-react';
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

// ===================== COUNT-UP ANIMATION HOOK =====================
const useCountUp = (targetValue: number, duration: number = 1500) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        if (targetValue === previousValue.current) return;

        const startValue = previousValue.current;
        const diff = targetValue - startValue;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (diff * easeOutQuart);

            setDisplayValue(Math.round(currentValue));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = targetValue;
            }
        };

        requestAnimationFrame(animate);
    }, [targetValue, duration]);

    return displayValue;
};

// ===================== MULTI-FACTOR HEALTH SCORES =====================
interface HealthScores {
    liquidity: number;
    growth: number;
    risk: number;
    goal: number;
    overall: number;
}

const calculateHealthScores = (stats: any, dynamicHealthScore: number): HealthScores => {
    // Liquidity Score: Emergency fund coverage (assume 6 months expenses = 100%)
    // Simple approximation: if total assets > 500k, assume decent liquidity
    const liquidityScore = Math.min(100, Math.round((stats?.totalAssets || 0) / 5000));

    // Growth Score: Based on P/L percentage
    const plPercent = parseFloat(stats?.totalPLPercent || '0');
    const growthScore = Math.min(100, Math.max(0, 50 + (plPercent * 2)));

    // Risk Score: Inverted - lower concentration = higher score
    const diversityScore = stats?.diversityScore || 50;
    const riskScore = Math.round(diversityScore);

    // Goal Score: Use progress toward target
    const goalScore = Math.min(100, dynamicHealthScore);

    // Overall: Weighted average
    const overall = Math.round(
        (liquidityScore * 0.2) +
        (growthScore * 0.3) +
        (riskScore * 0.25) +
        (goalScore * 0.25)
    );

    return { liquidity: liquidityScore, growth: growthScore, risk: riskScore, goal: goalScore, overall };
};

// ===================== SCORE RING COMPONENT =====================
const ScoreRing: React.FC<{
    score: number;
    label: string;
    icon: React.ReactNode;
    color: string;
    size?: 'sm' | 'md';
}> = ({ score, label, icon, color, size = 'sm' }) => {
    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`relative ${size === 'md' ? 'w-14 h-14' : 'w-10 h-10'}`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none"
                        className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="3" />
                    <circle cx="20" cy="20" r="18" fill="none"
                        className={color} strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
            <span className={`text-xs font-mono font-bold ${color.replace('stroke-', 'text-')}`}>{score}</span>
        </div>
    );
};

// ===================== CELEBRATION OVERLAY =====================
const CelebrationOverlay: React.FC<{ show: boolean; milestone: string }> = ({ show, milestone }) => {
    if (!show) return null;

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
                <PartyPopper className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-bounce" />
                <p className="text-2xl font-black text-white">{milestone}</p>
                <p className="text-sm text-emerald-400 font-bold">Milestone Reached! 🎉</p>
            </div>
        </div>
    );
};

const HeroSection: React.FC<HeroSectionProps> = ({
    stats, isPrivacyMode, dynamicHealthScore, formatCurrency,
    lifeEvents, addLifeEvent, deleteLifeEvent
}) => {
    const [showLiability, setShowLiability] = useState(false);
    const [newEventName, setNewEventName] = useState('');
    const [newEventAmount, setNewEventAmount] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMilestone, setCelebrationMilestone] = useState('');
    const previousMilestone = useRef(0);

    // Animated Net Worth Display
    const displayAmount = showLiability ? (stats?.totalCurrent || 0) : (stats?.totalAssets || 0);
    const animatedAmount = useCountUp(displayAmount);

    // Multi-factor Health Scores
    const healthScores = useMemo(() =>
        calculateHealthScores(stats, dynamicHealthScore),
        [stats, dynamicHealthScore]
    );

    // Dynamic gradient based on overall health
    const getGradientClass = () => {
        if (healthScores.overall > 75) return 'from-emerald-500/5 via-transparent to-cyan-500/5';
        if (healthScores.overall > 50) return 'from-amber-500/5 via-transparent to-orange-500/5';
        return 'from-rose-500/5 via-transparent to-pink-500/5';
    };

    // Milestone celebration detection
    useEffect(() => {
        const milestones = [100000, 500000, 1000000, 2500000, 5000000, 10000000];
        const currentValue = stats?.totalAssets || 0;

        for (const milestone of milestones) {
            if (currentValue >= milestone && previousMilestone.current < milestone) {
                setCelebrationMilestone(`₹${(milestone / 100000).toFixed(0)}L`);
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 3000);
                break;
            }
        }
        previousMilestone.current = currentValue;
    }, [stats?.totalAssets]);

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
            {/* MAIN NET WORTH CARD */}
            <div className={`lg:col-span-8 bg-gradient-to-br ${getGradientClass()} bg-white dark:bg-slate-900 rounded-2xl p-8 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500`}>
                {/* Celebration Overlay */}
                <CelebrationOverlay show={showCelebration} milestone={celebrationMilestone} />

                {/* Animated Background Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 right-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl animate-pulse delay-700" />
                </div>

                <div className="flex flex-col h-full justify-between relative z-10">
                    {/* Header with Toggle */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                {showLiability ? 'Real-Time Net Worth' : 'Gross Asset Value'}
                            </p>
                            {stats?.totalPLPercent && (
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${parseFloat(stats.totalPLPercent) >= 0
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                    }`}>
                                    <TrendingUp size={10} />
                                    {stats.totalPLPercent}%
                                </div>
                            )}
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setShowLiability(false)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!showLiability
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Gross
                            </button>
                            <button
                                onClick={() => setShowLiability(true)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${showLiability
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Net
                            </button>
                        </div>
                    </div>

                    {/* Animated Net Worth Display */}
                    <div className="flex items-baseline gap-3 mb-6">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums transition-all duration-300">
                            {isPrivacyMode ? '••••••' : formatCurrency(animatedAmount)}
                        </h1>
                        {!isPrivacyMode && healthScores.overall > 75 && (
                            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                        )}
                    </div>

                    {/* Multi-Factor Health Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
                        <ScoreRing
                            score={healthScores.liquidity}
                            label="Liquidity"
                            icon={<Droplets size={12} className="text-blue-500" />}
                            color="stroke-blue-500"
                        />
                        <ScoreRing
                            score={healthScores.growth}
                            label="Growth"
                            icon={<TrendingUp size={12} className="text-emerald-500" />}
                            color="stroke-emerald-500"
                        />
                        <ScoreRing
                            score={healthScores.risk}
                            label="Risk"
                            icon={<Shield size={12} className="text-amber-500" />}
                            color="stroke-amber-500"
                        />
                        <ScoreRing
                            score={healthScores.goal}
                            label="Goal"
                            icon={<Target size={12} className="text-indigo-500" />}
                            color="stroke-indigo-500"
                        />
                    </div>

                    {/* Bottom Stats Row */}
                    <div className="grid grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p>
                            <p className="text-slate-700 dark:text-slate-200 font-mono text-lg font-semibold tabular-nums">
                                {isPrivacyMode ? '••••' : formatCurrency(stats?.totalAssets || 0)}
                            </p>
                        </div>
                        <div className={`transition-opacity duration-300 ${!showLiability ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Liabilities</p>
                            <p className="text-rose-500 font-mono text-lg font-semibold tabular-nums">
                                -{isPrivacyMode ? '••••' : formatCurrency(stats?.totalLiability || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Overall Score</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24">
                                    <div
                                        className={`h-full transition-all duration-1000 ${healthScores.overall > 75 ? 'bg-emerald-500' :
                                            healthScores.overall > 50 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                        style={{ width: `${healthScores.overall}%` }}
                                    />
                                </div>
                                <span className={`font-mono text-sm font-bold ${healthScores.overall > 75 ? 'text-emerald-500' :
                                    healthScores.overall > 50 ? 'text-amber-500' : 'text-rose-500'
                                    }`}>
                                    {healthScores.overall}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MILESTONE TIMELINE */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Milestone size={16} className="text-indigo-500" />
                        Milestone Timeline
                    </h3>
                    {lifeEvents.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                            {lifeEvents.length} events
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[150px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {lifeEvents.length === 0 && (
                        <div className="text-center py-6">
                            <Milestone className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 italic">No future events logged.</p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600">Add weddings, vacations, or big purchases</p>
                        </div>
                    )}
                    {lifeEvents.map((evt, idx) => (
                        <div
                            key={evt.id}
                            className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{evt.name}</p>
                                    <p className="text-[10px] text-slate-500">{evt.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-rose-500">-{formatCurrency(evt.amount)}</span>
                                <button
                                    onClick={() => evt.id && deleteLifeEvent(evt.id)}
                                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Add Life Event</p>
                    <div className="space-y-2">
                        <input
                            value={newEventName}
                            onChange={e => setNewEventName(e.target.value)}
                            placeholder="e.g. Wedding, Vacation, Car"
                            className="w-full p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-colors"
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={newEventAmount}
                                onChange={e => setNewEventAmount(e.target.value)}
                                placeholder="₹ Amount"
                                className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-colors"
                            />
                            <input
                                type="date"
                                value={newEventDate}
                                onChange={e => setNewEventDate(e.target.value)}
                                className="flex-1 p-2 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleAddEvent}
                            disabled={!newEventName || !newEventAmount || !newEventDate}
                            className="w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                        >
                            Add Milestone
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
