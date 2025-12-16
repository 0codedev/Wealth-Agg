
import React from 'react';
import { Investment } from '../../types';
import InsiderRadar from './InsiderRadar';
import BulkDealScanner from './BulkDealScanner';
import TaxHarvester from './TaxHarvester';
import { Zap, Activity, Radio, AlertOctagon } from 'lucide-react';

interface AlphaPredatorProps {
    investments: Investment[];
}

const AlphaPredator: React.FC<AlphaPredatorProps> = ({ investments }) => {
    return (
        <div className="space-y-6 animate-in fade-in pb-24 md:pb-0">
            {/* Header / Command Center Status */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg animate-pulse">
                                <Radio size={24} className="text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">ALPHA PREDATOR <span className="text-indigo-500">ENGINE</span></h2>
                        </div>
                        <p className="text-slate-400 max-w-xl">
                            Real-time surveillance of market anomalies. Tracking 5,000+ stocks for insider accumulation, bulk deals, and tax optimization opportunities.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-500 uppercase">System Status</p>
                            <p className="text-emerald-400 font-mono font-bold flex items-center justify-end gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                ONLINE
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
                {/* Column 1: Insider Radar */}
                <div className="lg:col-span-1 h-full">
                    <InsiderRadar />
                </div>

                {/* Column 2: Bulk Deals */}
                <div className="lg:col-span-1 h-full">
                    <BulkDealScanner />
                </div>

                {/* Column 3: Tax Harvester (Personalized) */}
                <div className="lg:col-span-1 h-full">
                    <TaxHarvester investments={investments} />
                </div>
            </div>

            {/* Bottom Insight Banner */}
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <AlertOctagon size={24} className="text-indigo-400 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-white">AI Analysis: HDFCBANK</p>
                        <p className="text-xs text-indigo-200">
                            <strong>Insider BUY</strong> detected today matches <strong>Bulk Deal</strong> from yesterday. High probability Reversal setup accumulating.
                        </p>
                    </div>
                </div>
                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                    Execute Trade
                </button>
            </div>
        </div>
    );
};

export default AlphaPredator;
