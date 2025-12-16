import React from 'react';
import { Beaker } from 'lucide-react';
import SIPTimeMachine from './market/strategies/SIPTimeMachine';
import RebalanceAlpha from './market/strategies/RebalanceAlpha';

/**
 * StrategyLab - Quantitative Backtesting & Simulation Engine
 */
const StrategyLab: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Beaker className="text-purple-500" size={24} />
                    <h1 className="text-2xl font-bold text-white">Strategy Lab</h1>
                </div>
                <p className="text-slate-400 text-sm">
                    Quantitative Backtesting & Simulation Engine. Validate your hypothesis before risking capital.
                </p>
            </div>

            {/* Strategy Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SIP Time Machine */}
                <div className="h-[500px]">
                    <SIPTimeMachine />
                </div>

                {/* Rebalance Alpha */}
                <div className="h-[500px]">
                    <RebalanceAlpha />
                </div>
            </div>
        </div>
    );
};

export default StrategyLab;
