import React, { useMemo } from 'react';
import { Target, TrendingUp, Calendar, Flame, Trophy, Zap } from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import { usePortfolio } from '../../../hooks/usePortfolio';
import { formatCurrency } from '../../../utils/helpers';

interface GoalThermometerProps {
    currentNetWorth?: number;
}

export const GoalThermometer: React.FC<GoalThermometerProps> = ({ currentNetWorth: propNetWorth }) => {
    const { stats } = usePortfolio();
    const { targetNetWorth, targetDate } = useSettingsStore();

    const currentNetWorth = propNetWorth ?? stats?.totalCurrent ?? 0;

    const progress = useMemo(() => {
        if (!targetNetWorth || targetNetWorth <= 0) return 0;
        return Math.min((currentNetWorth / targetNetWorth) * 100, 100);
    }, [currentNetWorth, targetNetWorth]);

    const daysRemaining = useMemo(() => {
        if (!targetDate) return 0;
        const target = new Date(targetDate);
        const today = new Date();
        const diff = target.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [targetDate]);

    const monthsRemaining = Math.ceil(daysRemaining / 30);
    const gap = targetNetWorth - currentNetWorth;
    const monthlySavingsNeeded = monthsRemaining > 0 ? gap / monthsRemaining : 0;

    // Persona based on progress
    const getPersona = () => {
        if (progress >= 100) return { label: 'GOAL ACHIEVED!', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: Trophy };
        if (progress >= 75) return { label: 'Almost There', color: 'text-indigo-500', bg: 'bg-indigo-500', icon: Zap };
        if (progress >= 50) return { label: 'Halfway Point', color: 'text-amber-500', bg: 'bg-amber-500', icon: TrendingUp };
        if (progress >= 25) return { label: 'Building Momentum', color: 'text-blue-500', bg: 'bg-blue-500', icon: Flame };
        return { label: 'Just Getting Started', color: 'text-slate-400', bg: 'bg-slate-500', icon: Target };
    };

    const persona = getPersona();
    const PersonaIcon = persona.icon;

    return (
        <div className="glass-panel rounded-2xl p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${persona.bg}/20`}>
                        <Target className={persona.color} size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white">Goal Thermometer</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${persona.bg}/20 ${persona.color}`}>
                    {progress.toFixed(0)}%
                </span>
            </div>

            {/* Thermometer Visual */}
            <div className="flex-1 flex items-center gap-4 mb-4">
                {/* Vertical Thermometer */}
                <div className="relative w-8 h-32 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700">
                    {/* Fill */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 ${persona.bg} transition-all duration-1000 ease-out`}
                        style={{ height: `${progress}%` }}
                    />
                    {/* Markers */}
                    {[25, 50, 75, 100].map(mark => (
                        <div
                            key={mark}
                            className="absolute left-0 right-0 h-px bg-slate-400/50"
                            style={{ bottom: `${mark}%` }}
                        />
                    ))}
                    {/* Bulb at bottom */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full ${persona.bg} border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center`}>
                        <PersonaIcon className="text-white" size={16} />
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Current</p>
                        <p className="text-lg font-black text-slate-800 dark:text-white">
                            {formatCurrency(currentNetWorth)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Target</p>
                        <p className="text-lg font-black text-indigo-500">
                            {formatCurrency(targetNetWorth)}
                        </p>
                    </div>
                    <div className={`p-2 rounded-lg ${persona.bg}/10`}>
                        <p className={`text-xs font-bold ${persona.color} flex items-center gap-1`}>
                            <PersonaIcon size={12} />
                            {persona.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase">Time Left</span>
                    </div>
                    <p className="text-sm font-black text-slate-700 dark:text-white">
                        {monthsRemaining} months
                    </p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-bold uppercase">Monthly Gap</span>
                    </div>
                    <p className={`text-sm font-black ${gap > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {gap > 0 ? formatCurrency(monthlySavingsNeeded) : 'Done!'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoalThermometer;
