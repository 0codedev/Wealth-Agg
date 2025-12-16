
import React, { useState, useEffect } from 'react';
import { Layers, Activity, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { marketDataService, BulkDeal } from '../../services/MarketDataService';

const BulkDealScanner: React.FC = () => {
    const [deals, setDeals] = useState<BulkDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async (force = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await marketDataService.fetchBulkDeals(force);
            setDeals(data);
        } catch (err: any) {
            console.error("BulkDealScanner Load Error:", err);
            setDeals(marketDataService.getMockBulk());
            if (err.message.includes("Quota")) {
                setError("Quota Limit: Using Mock");
            } else {
                setError("API Error: Using Mock");
            }
        }
        setIsLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = () => {
        loadData(true);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers size={80} className={`text-amber-500 ${error ? 'text-amber-600' : ''}`} />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Bulk Deal Scanner</h3>
                        <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                            <AlertCircle size={10} />
                            TRACKING SMART MONEY
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {marketDataService.isLive() && (
                        <button
                            onClick={handleRefresh}
                            className={`p-1 hover:bg-slate-800 rounded transition-colors ${error ? 'text-rose-400' : 'text-slate-500 hover:text-amber-400'}`}
                            title="Refresh Data (Uses Quota)"
                        >
                            <Activity size={14} />
                        </button>
                    )}
                    {error ? (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                            {error}
                        </span>
                    ) : marketDataService.isLive() && (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                            LIVE
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4 relative z-10 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    deals.map((deal) => (
                        <div key={deal.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-amber-500/20">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white">{deal.ticker}</h4>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deal.change > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {deal.change > 0 ? '+' : ''}{deal.change}%
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 truncate w-32 md:w-48" title={deal.client}>
                                    {deal.client}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5 mb-1">
                                    <span className={`text-[10px] font-bold uppercase ${deal.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {deal.type}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span className="text-xs font-mono font-bold text-white">{formatCurrency(deal.value)}</span>
                                </div>

                                <p className="text-[10px] text-slate-500">
                                    @ ₹{deal.price} / share
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 shrink-0 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <Activity size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-amber-200">Insight</p>
                    <p className="text-[10px] text-amber-300/80 leading-relaxed">
                        Institutional Buying in <span className="text-white font-bold">SUZLON</span> correlates with the recent breakout. Watch for a retest of 18.0 levels.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkDealScanner;
