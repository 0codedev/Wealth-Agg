import React, { useMemo, useState, useEffect } from 'react';
import {
    Mountain, Flag, Target, TrendingUp, Zap, Calendar, ChevronRight,
    Trophy, Sparkles, Timer, ArrowUp, Star, Flame, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Project5LWidgetProps {
    currentWealth?: number;
    targetWealth?: number;
    monthlyContribution?: number;
    expectedReturn?: number;
}

// Milestone configuration
const MILESTONES = [
    { value: 100000, label: '₹1L', icon: Flag, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { value: 500000, label: '₹5L', icon: Star, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { value: 1000000, label: '₹10L', icon: Flame, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { value: 2500000, label: '₹25L', icon: Trophy, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { value: 5000000, label: '₹50L', icon: Gift, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
];

// Format large numbers
const formatCompact = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
};

// Calculate days to goal
const calculateDaysToGoal = (current: number, target: number, monthly: number, returnRate: number): number => {
    if (current >= target) return 0;
    if (monthly <= 0) return Infinity;

    const monthlyRate = returnRate / 100 / 12;
    let months = 0;
    let wealth = current;

    while (wealth < target && months < 600) { // Max 50 years
        wealth = wealth * (1 + monthlyRate) + monthly;
        months++;
    }

    return months * 30; // Approximate days
};

// Mountain SVG Component with animated path
const MountainVisualization: React.FC<{ progress: number; milestones: typeof MILESTONES; currentValue: number }> =
    React.memo(({ progress, milestones, currentValue }) => {

        const clampedProgress = Math.min(100, Math.max(0, progress));

        // Calculate climber position on the mountain path
        const getClimberPosition = (progressPercent: number) => {
            // Mountain path coordinates (approximate)
            const startX = 20, startY = 280;
            const peakX = 200, peakY = 40;

            const x = startX + (peakX - startX) * (progressPercent / 100);
            const y = startY - (startY - peakY) * (progressPercent / 100);
            return { x, y };
        };

        const climberPos = getClimberPosition(clampedProgress);

        return (
            <div className="relative w-full h-48">
                <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Background gradient */}
                    <defs>
                        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1e1b4b" />
                            <stop offset="100%" stopColor="#312e81" />
                        </linearGradient>
                        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                    </defs>

                    {/* Sky */}
                    <rect x="0" y="0" width="400" height="300" fill="url(#skyGradient)" />

                    {/* Stars */}
                    {[...Array(20)].map((_, i) => (
                        <motion.circle
                            key={i}
                            cx={Math.random() * 400}
                            cy={Math.random() * 100}
                            r={Math.random() * 1.5 + 0.5}
                            fill="white"
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                        />
                    ))}

                    {/* Mountain silhouette (background) */}
                    <path
                        d="M0 300 L100 180 L150 200 L200 40 L250 150 L300 100 L350 200 L400 150 L400 300 Z"
                        fill="url(#mountainGradient)"
                        opacity="0.3"
                    />

                    {/* Main mountain */}
                    <path
                        d="M50 300 L200 40 L350 300 Z"
                        fill="url(#mountainGradient)"
                    />

                    {/* Snow cap */}
                    <path
                        d="M170 100 L200 40 L230 100 L215 95 L200 105 L185 95 Z"
                        fill="#e0e7ff"
                        opacity="0.9"
                    />

                    {/* Progress path (glowing) */}
                    <path
                        d="M50 300 L200 40"
                        stroke="url(#progressGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${clampedProgress * 2.8} 280`}
                        fill="none"
                        filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))"
                    />

                    {/* Milestone flags */}
                    {milestones.map((milestone, idx) => {
                        const milestoneProgress = (milestone.value / (currentValue * 2)) * 100;
                        if (milestoneProgress > 100) return null;

                        const pos = getClimberPosition(Math.min(milestoneProgress, 95));
                        const achieved = currentValue >= milestone.value;

                        return (
                            <g key={milestone.label}>
                                {/* Flag pole */}
                                <line
                                    x1={pos.x + idx * 5}
                                    y1={pos.y}
                                    x2={pos.x + idx * 5}
                                    y2={pos.y - 20}
                                    stroke={achieved ? "#10b981" : "#64748b"}
                                    strokeWidth="2"
                                />
                                {/* Flag */}
                                <motion.polygon
                                    points={`${pos.x + idx * 5},${pos.y - 20} ${pos.x + idx * 5 + 15},${pos.y - 15} ${pos.x + idx * 5},${pos.y - 10}`}
                                    fill={achieved ? "#10b981" : "#64748b"}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: idx * 0.1, type: "spring" }}
                                />
                                {/* Label */}
                                <text
                                    x={pos.x + idx * 5}
                                    y={pos.y - 25}
                                    fontSize="8"
                                    fill={achieved ? "#10b981" : "#94a3b8"}
                                    textAnchor="middle"
                                    fontWeight="bold"
                                >
                                    {milestone.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Climber */}
                    <motion.g
                        initial={{ x: 0, y: 0 }}
                        animate={{ x: climberPos.x - 20, y: climberPos.y - 300 }}
                        transition={{ type: "spring", stiffness: 50 }}
                    >
                        <circle cx="20" cy="290" r="8" fill="#f59e0b" />
                        <circle cx="20" cy="285" r="4" fill="#fbbf24" />
                        {/* Glow effect */}
                        <circle cx="20" cy="290" r="12" fill="#f59e0b" opacity="0.3" />
                    </motion.g>

                    {/* Peak flag */}
                    <motion.g
                        initial={{ scale: 0 }}
                        animate={{ scale: clampedProgress >= 95 ? 1.2 : 1 }}
                        transition={{ type: "spring", repeat: clampedProgress >= 95 ? Infinity : 0, repeatType: "reverse" }}
                    >
                        <line x1="200" y1="40" x2="200" y2="15" stroke="#fbbf24" strokeWidth="3" />
                        <polygon points="200,15 220,22 200,29" fill="#fbbf24" />
                        <Trophy className="text-amber-400" style={{ transform: 'translate(185px, 0px)' }} />
                    </motion.g>
                </svg>
            </div>
        );
    });

const Project5LWidget: React.FC<Project5LWidgetProps> = ({
    currentWealth = 850000,
    targetWealth = 5000000,
    monthlyContribution = 25000,
    expectedReturn = 12
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    const progress = useMemo(() => {
        return Math.min(100, (currentWealth / targetWealth) * 100);
    }, [currentWealth, targetWealth]);

    const daysToGoal = useMemo(() => {
        return calculateDaysToGoal(currentWealth, targetWealth, monthlyContribution, expectedReturn);
    }, [currentWealth, targetWealth, monthlyContribution, expectedReturn]);

    const yearsToGoal = useMemo(() => {
        return Math.floor(daysToGoal / 365);
    }, [daysToGoal]);

    const monthsRemaining = useMemo(() => {
        return Math.floor((daysToGoal % 365) / 30);
    }, [daysToGoal]);

    const achievedMilestones = useMemo(() => {
        return MILESTONES.filter(m => currentWealth >= m.value);
    }, [currentWealth]);

    const nextMilestone = useMemo(() => {
        return MILESTONES.find(m => currentWealth < m.value);
    }, [currentWealth]);

    // Animate progress on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 300);
        return () => clearTimeout(timer);
    }, [progress]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Mountain size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                            PROJECT 5L
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">WEALTH CLIMB</span>
                        </h3>
                        <p className="text-xs text-indigo-300/60">Your journey to financial freedom</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-2 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                    <ChevronRight size={16} className={`transform transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Mountain Visualization */}
            <MountainVisualization
                progress={animatedProgress}
                milestones={MILESTONES}
                currentValue={currentWealth}
            />

            {/* Progress Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Current</p>
                    <p className="text-lg font-black text-emerald-400 font-mono">{formatCompact(currentWealth)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target</p>
                    <p className="text-lg font-black text-indigo-400 font-mono">{formatCompact(targetWealth)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Progress</p>
                    <p className="text-lg font-black text-amber-400 font-mono">{progress.toFixed(1)}%</p>
                </div>
            </div>

            {/* Days to Goal Calculator */}
            <div className="mt-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl p-4 border border-indigo-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Timer size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-indigo-300/60 uppercase font-bold">Estimated Time to Goal</p>
                            <p className="text-xl font-black text-white">
                                {daysToGoal === 0 ? (
                                    <span className="text-emerald-400">🎉 Goal Achieved!</span>
                                ) : daysToGoal === Infinity ? (
                                    <span className="text-rose-400">No SIP Set</span>
                                ) : (
                                    <>
                                        {yearsToGoal > 0 && <span>{yearsToGoal}y </span>}
                                        {monthsRemaining > 0 && <span>{monthsRemaining}m</span>}
                                        <span className="text-sm text-slate-400 ml-2">({Math.round(daysToGoal)} days)</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-indigo-300/60 uppercase font-bold">Monthly SIP</p>
                        <p className="text-lg font-bold text-indigo-400 font-mono">{formatCompact(monthlyContribution)}</p>
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Flag size={12} /> Milestones
                            </h4>
                            <div className="grid grid-cols-5 gap-2">
                                {MILESTONES.map((milestone, idx) => {
                                    const achieved = currentWealth >= milestone.value;
                                    const MilestoneIcon = milestone.icon;
                                    return (
                                        <motion.div
                                            key={milestone.label}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-2 rounded-xl text-center border transition-all ${achieved
                                                ? `${milestone.bgColor} border-current ${milestone.color}`
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                                                }`}
                                        >
                                            <MilestoneIcon size={16} className="mx-auto mb-1" />
                                            <p className="text-[10px] font-bold">{milestone.label}</p>
                                            {achieved && <Sparkles size={10} className="mx-auto mt-1" />}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Next Milestone */}
                        {nextMilestone && (
                            <div className="mt-4 bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target size={14} className="text-amber-400" />
                                        <span className="text-xs text-slate-400">Next milestone:</span>
                                        <span className={`text-sm font-bold ${nextMilestone.color}`}>{nextMilestone.label}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">
                                        {formatCompact(nextMilestone.value - currentWealth)} to go
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentWealth / nextMilestone.value) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement badges */}
            {achievedMilestones.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-xs text-slate-400">{achievedMilestones.length} milestones achieved</span>
                    <div className="flex -space-x-1">
                        {achievedMilestones.slice(-3).map((m, i) => (
                            <div key={m.label} className={`w-6 h-6 rounded-full ${m.bgColor} flex items-center justify-center border-2 border-slate-900`}>
                                <m.icon size={10} className={m.color} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Project5LWidget;
