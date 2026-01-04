import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Check, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

interface RebalancingWizardProps {
    investments?: { id: string; name: string; currentValue: number; assetClass?: string }[];
    formatCurrency?: (val: number) => string;
}

// Target allocation (simplified)
const TARGET_ALLOCATION = {
    'Equity': 60,
    'Debt': 25,
    'Gold': 10,
    'Cash': 5,
};

const RebalancingWizard: React.FC<RebalancingWizardProps> = ({
    investments = [],
    formatCurrency = (v) => `₹${v.toLocaleString()}`
}) => {
    const [showDetails, setShowDetails] = useState(false);

    // Calculate current allocation and rebalancing suggestions
    const analysis = useMemo(() => {
        if (investments.length === 0) {
            // Demo data
            return {
                total: 1000000,
                current: { 'Equity': 70, 'Debt': 15, 'Gold': 10, 'Cash': 5 },
                suggestions: [
                    { asset: 'Equity', action: 'Sell', amount: 100000, reason: 'Over-allocated by 10%' },
                    { asset: 'Debt', action: 'Buy', amount: 100000, reason: 'Under-allocated by 10%' },
                ],
                score: 75,
            };
        }

        const total = investments.reduce((sum, i) => sum + i.currentValue, 0);
        const byClass: Record<string, number> = {};

        investments.forEach(i => {
            const cls = i.assetClass || 'Equity';
            byClass[cls] = (byClass[cls] || 0) + i.currentValue;
        });

        const current: Record<string, number> = {};
        const suggestions: { asset: string; action: string; amount: number; reason: string }[] = [];

        Object.entries(TARGET_ALLOCATION).forEach(([asset, target]) => {
            const actual = ((byClass[asset] || 0) / total) * 100;
            current[asset] = actual;

            const diff = actual - target;
            if (Math.abs(diff) > 5) {
                const amount = Math.abs(diff / 100 * total);
                suggestions.push({
                    asset,
                    action: diff > 0 ? 'Sell' : 'Buy',
                    amount,
                    reason: `${diff > 0 ? 'Over' : 'Under'}-allocated by ${Math.abs(diff).toFixed(0)}%`
                });
            }
        });

        const score = 100 - suggestions.reduce((s, sug) => s + Math.abs(sug.amount / total * 100), 0);

        return { total, current, suggestions, score: Math.max(0, score) };
    }, [investments]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900 rounded-2xl border border-violet-500/20 p-4 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Scale size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Rebalancing</h3>
                        <p className="text-[9px] text-slate-500">Portfolio alignment</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${analysis.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        analysis.score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                    }`}>
                    {analysis.score.toFixed(0)}% Balanced
                </div>
            </div>

            {/* Current vs Target */}
            <div className="space-y-2 mb-3">
                {Object.entries(TARGET_ALLOCATION).map(([asset, target]) => {
                    const actual = analysis.current[asset] || 0;
                    const diff = actual - target;
                    const isOk = Math.abs(diff) <= 5;

                    return (
                        <div key={asset} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-12">{asset}</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                                <div
                                    className="absolute h-full bg-violet-500/50"
                                    style={{ width: `${target}%` }}
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${actual}%` }}
                                    className={`absolute h-full ${isOk ? 'bg-emerald-500' : diff > 0 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                />
                            </div>
                            <span className={`text-[9px] font-mono w-12 text-right ${isOk ? 'text-slate-400' : diff > 0 ? 'text-amber-400' : 'text-blue-400'
                                }`}>
                                {actual.toFixed(0)}%/{target}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Suggestions</p>
                    {analysis.suggestions.slice(0, 2).map((sug, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border text-[10px] ${sug.action === 'Buy'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                            <div className="flex items-center gap-1">
                                {sug.action === 'Buy' ? <ArrowRight size={10} /> : <RefreshCw size={10} />}
                                <span className="font-bold">{sug.action}</span>
                                <span>{sug.asset}</span>
                                <span className="ml-auto font-mono">{formatCurrency(sug.amount)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Portfolio is well balanced!</span>
                </div>
            )}
        </div>
    );
};

export default RebalancingWizard;
