
import React, { useMemo } from 'react';
import { Investment } from '../../types';
import { formatCurrency, calculatePercentage } from '../../utils/helpers';
import { Calculator, ArrowRight, AlertTriangle, Scale, Percent } from 'lucide-react';

interface TaxHarvesterProps {
    investments: Investment[];
}

const TaxHarvester: React.FC<TaxHarvesterProps> = ({ investments }) => {

    // Logic: Identify assets with Unrealized Loss > 5% (Worth harvesting)
    const harvestCandidates = useMemo(() => {
        return investments
            .filter(inv => {
                const gain = inv.currentValue - inv.investedAmount;
                const gainPct = (gain / inv.investedAmount) * 100;
                return gainPct < -5; // Only show significant losses
            })
            .sort((a, b) => {
                // Sort by biggest *absolute* loss first
                const lossA = a.investedAmount - a.currentValue;
                const lossB = b.investedAmount - b.currentValue;
                return lossB - lossA;
            });
    }, [investments]);

    const totalHarvestableLoss = harvestCandidates.reduce((acc, curr) => acc + (curr.investedAmount - curr.currentValue), 0);
    const potentialTaxSave = totalHarvestableLoss * 0.15; // Assume 15% STCG offset

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Scale size={80} className="text-rose-500" />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Tax Harvester</h3>
                        <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                            <AlertTriangle size={10} />
                            FY END OPTIMIZER
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Harvestable Loss</p>
                        <p className="text-xl font-mono font-bold text-rose-400">{formatCurrency(totalHarvestableLoss)}</p>
                    </div>
                    <div className="p-3 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold">Tax Savings (Est)</p>
                        <p className="text-xl font-mono font-bold text-emerald-400">{formatCurrency(potentialTaxSave)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[150px]">
                    {harvestCandidates.length > 0 ? (
                        harvestCandidates.map(inv => {
                            const loss = inv.currentValue - inv.investedAmount;
                            const lossPct = (loss / inv.investedAmount) * 100;
                            return (
                                <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl border border-transparent hover:border-rose-500/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-white text-sm">{inv.name}</p>
                                        <p className="text-[10px] text-slate-500">Invested: {formatCurrency(inv.investedAmount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-rose-500 text-sm">{formatCurrency(loss)}</p>
                                        <p className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded inline-block">
                                            {lossPct.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                            <Scale size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">No harvestable losses found.<br />Your portfolio is too green!</p>
                        </div>
                    )}
                </div>

                <button className="w-full mt-4 shrink-0 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-rose-900/20">
                    Generate Harvesting Report
                </button>
            </div>
        </div>
    );
};

export default TaxHarvester;
