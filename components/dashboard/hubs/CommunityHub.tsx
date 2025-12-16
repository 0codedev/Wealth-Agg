import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { InvestmentClubsWidget, ChallengesWidget, SharePortfolioButton, AchievementsWidget } from '../../shared/GodTierFeatures';
import { Investment, AggregatedData } from '../../../types';

interface CommunityHubProps {
    onBack: () => void;
    investments: Investment[];
    stats: any;
    assetClassData: AggregatedData[];
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ onBack, investments, stats, assetClassData }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            🏆 Community & Rewards
                        </h1>
                        <p className="text-sm text-slate-500">Compete with friends, unlock achievements, and climb the leaderboard</p>
                    </div>
                </div>
                <SharePortfolioButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AchievementsWidget investments={investments} stats={stats} assetClassData={assetClassData} />
                </div>
                <div className="space-y-6">
                    <InvestmentClubsWidget />
                    <ChallengesWidget />
                </div>
            </div>
        </div>
    );
};
