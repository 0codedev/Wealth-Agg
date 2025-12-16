import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { NewsSentimentWidget, PeerComparisonWidget } from '../../shared/GodTierFeatures';
import { TelegramBot } from '../../integrations/TelegramBot';
import { Investment } from '../../../types';

interface MarketInsightsHubProps {
    onBack: () => void;
    stats: any;
    investments: Investment[];
}

export const MarketInsightsHub: React.FC<MarketInsightsHubProps> = ({ onBack, stats, investments }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        📈 Market Insights
                    </h1>
                    <p className="text-sm text-slate-500">Deep dive into market sentiment and peer benchmarking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NewsSentimentWidget />
                <TelegramBot investments={investments} />
                <PeerComparisonWidget stats={stats} />
            </div>
        </div>
    );
};
