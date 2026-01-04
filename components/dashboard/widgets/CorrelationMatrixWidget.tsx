import React, { useMemo } from 'react';
import { GitBranch, Info } from 'lucide-react';

interface CorrelationMatrixWidgetProps {
    investments?: { name: string; assetClass?: string }[];
}

// Asset classes for correlation display
const ASSET_CLASSES = ['Equity', 'Debt', 'Gold', 'Real Estate', 'Cash'];

// Pre-computed correlation values (simplified for display)
const CORRELATIONS: Record<string, Record<string, number>> = {
    'Equity': { 'Equity': 1.0, 'Debt': 0.15, 'Gold': -0.1, 'Real Estate': 0.4, 'Cash': 0.05 },
    'Debt': { 'Equity': 0.15, 'Debt': 1.0, 'Gold': 0.2, 'Real Estate': 0.25, 'Cash': 0.6 },
    'Gold': { 'Equity': -0.1, 'Debt': 0.2, 'Gold': 1.0, 'Real Estate': 0.1, 'Cash': 0.15 },
    'Real Estate': { 'Equity': 0.4, 'Debt': 0.25, 'Gold': 0.1, 'Real Estate': 1.0, 'Cash': 0.2 },
    'Cash': { 'Equity': 0.05, 'Debt': 0.6, 'Gold': 0.15, 'Real Estate': 0.2, 'Cash': 1.0 },
};

const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return 'bg-red-500/80';
    if (value >= 0.4) return 'bg-orange-500/60';
    if (value >= 0.1) return 'bg-amber-500/40';
    if (value >= -0.1) return 'bg-slate-600/50';
    return 'bg-emerald-500/50';
};

const CorrelationMatrixWidget: React.FC<CorrelationMatrixWidgetProps> = ({ investments = [] }) => {
    const diversificationScore = useMemo(() => {
        // Simple diversification score based on having different asset classes
        const uniqueClasses = new Set(investments.map(i => i.assetClass || 'Equity'));
        return Math.min(100, uniqueClasses.size * 20);
    }, [investments]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 rounded-2xl border border-cyan-500/20 p-4 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <GitBranch size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Correlation Matrix</h3>
                        <p className="text-[9px] text-slate-500">Asset class correlations</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-500">Diversification</p>
                    <p className="text-sm font-bold text-cyan-400">{diversificationScore}%</p>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[280px]">
                    {/* Header Row */}
                    <div className="flex mb-1">
                        <div className="w-12" />
                        {ASSET_CLASSES.map(cls => (
                            <div key={cls} className="flex-1 text-center">
                                <span className="text-[8px] text-slate-500 font-bold">{cls.slice(0, 3)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Matrix Rows */}
                    {ASSET_CLASSES.map(rowClass => (
                        <div key={rowClass} className="flex mb-1">
                            <div className="w-12 flex items-center">
                                <span className="text-[8px] text-slate-500 font-bold">{rowClass.slice(0, 3)}</span>
                            </div>
                            {ASSET_CLASSES.map(colClass => {
                                const value = CORRELATIONS[rowClass][colClass];
                                return (
                                    <div key={colClass} className="flex-1 px-0.5">
                                        <div
                                            className={`h-8 rounded flex items-center justify-center ${getCorrelationColor(value)}`}
                                            title={`${rowClass} vs ${colClass}: ${value.toFixed(2)}`}
                                        >
                                            <span className="text-[9px] text-white font-mono font-bold">
                                                {value.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-emerald-500/50" />
                    <span className="text-[8px] text-slate-500">Low</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-500/40" />
                    <span className="text-[8px] text-slate-500">Med</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-red-500/80" />
                    <span className="text-[8px] text-slate-500">High</span>
                </div>
            </div>
        </div>
    );
};

export default CorrelationMatrixWidget;
