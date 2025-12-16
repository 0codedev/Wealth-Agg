
import React, { useMemo } from 'react';
import { Filex, TrendingDown, ArrowRight, Wallet, BadgePercent, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import { findHarvestingOpportunities } from '../../../utils/TaxRules';
import { Investment } from '../../../types';

interface TaxHarvestingWidgetProps {
    investments: Investment[];
    onClick?: () => void;
}

const TaxHarvestingWidget: React.FC<TaxHarvestingWidgetProps> = ({ investments, onClick }) => {

    // --- Tax Engine ---
    const opportunities = useMemo(() => findHarvestingOpportunities(investments), [investments]);

    const totalPotentialAlpha = opportunities.reduce((acc, curr) => acc + curr.potentialTaxSaving, 0);
    const topOpportunities = opportunities.slice(0, 3);

    return (
        <div
            onClick={onClick}
            className="h-full bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-indigo-900/50 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Filex size={80} className="text-amber-400" />
            </div>

            <div className="relative z-10 flex flex-col h-full">

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <BadgePercent size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-100">Tax Alpha</h3>
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Harvesting Opps</p>
                        </div>
                    </div>
                    {opportunities.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 animate-pulse">
                            {opportunities.length} Actions
                        </span>
                    )}
                </div>

                {/* Main Metric */}
                <div className="mb-4">
                    <p className="text-xs text-slate-400 font-medium mb-1">Potential Savings</p>
                    <h2 className={`text-2xl font-black font-mono ${totalPotentialAlpha > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {formatCurrency(totalPotentialAlpha)}
                    </h2>
                </div>

                {/* Opportunities List */}
                <div className="flex-1 space-y-2">
                    {topOpportunities.length > 0 ? (
                        topOpportunities.map(opp => (
                            <div key={opp.investmentId} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg border border-slate-800 hover:border-rose-900/50 transition-colors group/item">
                                <div>
                                    <p className="text-xs font-bold text-slate-300 truncate w-24 group-hover/item:text-white transition-colors">{opp.name}</p>
                                    <p className="text-[10px] text-rose-400 font-mono">Loss: {formatCurrency(opp.unrealizedLoss)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900">
                                        Save {formatCurrency(opp.potentialTaxSaving)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-2 opacity-50">
                            <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                            <p className="text-xs text-slate-400">No losses to harvest.</p>
                            <p className="text-[10px] text-slate-600">Great picking!</p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {opportunities.length > 3 && (
                    <div className="mt-2 text-center">
                        <p className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center justify-center gap-1">
                            View {opportunities.length - 3} more <ArrowRight size={10} />
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for the CheckCircle2 that was missing in imports
import { CheckCircle2 } from 'lucide-react';

export default TaxHarvestingWidget;
