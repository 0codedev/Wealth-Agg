import React from 'react';
import { Calculator, Clover } from 'lucide-react';

interface ProbabilityEngineProps {
    subscriptionX: number | '';
    setSubscriptionX: (val: number | '') => void;
    luckStats: {
        total: number;
        wins: number;
        ratio: number;
    };
}

const ProbabilityEngine: React.FC<ProbabilityEngineProps> = ({
    subscriptionX,
    setSubscriptionX,
    luckStats
}) => {
    // Local state for number of applications
    const [numApplications, setNumApplications] = React.useState<number>(1);

    // Probability Calculation
    const calculateProbability = (accounts: number) => {
        if (!subscriptionX || Number(subscriptionX) <= 1) return 100;
        const sub = Number(subscriptionX);
        const probSingle = 1 / sub;
        const probLoseSingle = 1 - probSingle;
        const probLoseAll = Math.pow(probLoseSingle, accounts);
        return ((1 - probLoseAll) * 100).toFixed(1);
    };

    return (
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-900/50 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
                <Calculator size={120} className="text-white" />
            </div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Calculator size={20} className="text-indigo-400" /> Allotment Probability Engine
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Don't guess. Calculate. Input the current subscription (e.g. 50x) to see your true odds.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Retail Subscription</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={subscriptionX}
                                    onChange={(e) => setSubscriptionX(parseFloat(e.target.value) || '')}
                                    placeholder="e.g. 50"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-xl font-mono font-bold outline-none focus:border-indigo-500 transition-colors"
                                />
                                <span className="text-slate-500 font-bold shrink-0">X</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Applications</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={numApplications}
                                    onChange={(e) => setNumApplications(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-xl font-mono font-bold outline-none focus:border-indigo-500 transition-colors"
                                />
                                <span className="text-slate-500 font-bold shrink-0">Nos</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* LUCK WIDGET (NEW) */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/40 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between group hover:bg-emerald-900/30 transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Clover size={64} className="text-emerald-400" />
                        </div>
                        <p className="text-xs text-emerald-300 font-bold uppercase mb-1 flex items-center gap-1">
                            Real Luck Score <Clover size={10} />
                        </p>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-white">{luckStats.ratio.toFixed(0)}%</div>
                            <span className="text-xs text-slate-400 font-mono">({luckStats.wins}/{luckStats.total})</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className={`bg-emerald-500 h-full transition-all duration-1000`} style={{ width: `${luckStats.ratio}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2">Based on historical allotment data.</p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-between group hover:bg-slate-800 transition-colors">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Theoretical ({numApplications} Acc)</p>
                        <div className="text-2xl font-black text-slate-200">{calculateProbability(numApplications)}%</div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-slate-400 h-full" style={{ width: `${calculateProbability(numApplications)}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2">Vs {subscriptionX || 0}x sub with {numApplications} apps.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProbabilityEngine;
