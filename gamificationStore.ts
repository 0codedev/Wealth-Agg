/**
 * Gamification Store - XP, Levels, and Achievements
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

interface GamificationState {
    xp: number;
    level: number;
    streak: number;
    achievements: Achievement[];
    addXP: (amount: number, reason?: string) => void;
    unlockAchievement: (achievementId: string) => void;
    incrementStreak: () => void;
    resetStreak: () => void;
}

const XP_PER_LEVEL = 1000;

const ACHIEVEMENTS_LIST: Achievement[] = [
    { id: 'first_trade', title: 'First Trade', description: 'Log your first trade', icon: '🎯' },
    { id: 'week_streak', title: 'Week Warrior', description: '7-day logging streak', icon: '🔥' },
    { id: 'budget_master', title: 'Budget Master', description: 'Stay under budget for a month', icon: '💰' },
    { id: 'diversified', title: 'Diversified', description: '5+ asset classes in portfolio', icon: '🌈' },
    { id: 'goal_achieved', title: 'Goal Crusher', description: 'Complete a savings goal', icon: '🎉' },
];

export const useGamification = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            streak: 0,
            achievements: [],

            addXP: (amount: number, reason?: string) => {
                set(state => {
                    const newXP = state.xp + amount;
                    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

                    if (reason) {
                        console.log(`[Gamification] +${amount} XP: ${reason}`);
                    }

                    return {
                        xp: newXP,
                        level: newLevel
                    };
                });
            },

            unlockAchievement: (achievementId: string) => {
                set(state => {
                    if (state.achievements.some(a => a.id === achievementId)) {
                        return state; // Already unlocked
                    }

                    const achievement = ACHIEVEMENTS_LIST.find(a => a.id === achievementId);
                    if (!achievement) return state;

                    console.log(`[Gamification] Achievement unlocked: ${achievement.title}`);

                    return {
                        achievements: [...state.achievements, {
                            ...achievement,
                            unlockedAt: new Date().toISOString()
                        }],
                        xp: state.xp + 250 // Bonus XP for achievement
                    };
                });
            },

            incrementStreak: () => {
                set(state => ({
                    streak: state.streak + 1,
                    xp: state.xp + 10 // Daily streak bonus
                }));
            },

            resetStreak: () => {
                set({ streak: 0 });
            }
        }),
        {
            name: 'wealth-aggregator-gamification'
        }
    )
);

export default useGamification;
