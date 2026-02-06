import React from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { OverlapMatrix } from '../analytics/OverlapMatrix';
import { TaxHarvestingWidget } from '../analytics/TaxHarvestingWidget';
import { RiskMetricsCard } from '../analytics/RiskMetricsCard';
import { Layers } from 'lucide-react';

export const QuantDashboard: React.FC = () => {
    const { investments } = usePortfolio();

    // Mock returns history for Risk Engine
    const mockReturns = [0.02, 0.05, -0.01, 0.03, 0.04, -0.02, 0.06, 0.01, 0.03, 0.02, 0.05, -0.03]; // 1 Year Monthly

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                    <Layers className="text-indigo-500" />
                    Deep Quant Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Professional grade analysis of your portfolio's efficiency, redundancy, and tax liabilities.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Row: Risk & Tax */}
                <div className="lg:col-span-1 h-[400px]">
                    <RiskMetricsCard returnsHistory={mockReturns} />
                </div>
                <div className="lg:col-span-1 h-[400px]">
                    <TaxHarvestingWidget investments={investments} />
                </div>
            </div>

            {/* Bottom Row: Overlap */}
            <div className="w-full h-[400px]">
                <OverlapMatrix investments={investments} />
            </div>
        </div>
    );
};

export default QuantDashboard;
