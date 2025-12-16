import React, { useState, useEffect } from 'react';
import { User, TrendingUp, TrendingDown, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { marketDataService, InsiderTrade } from '../../services/MarketDataService';

const InsiderRadar: React.FC = () => {
    const [trades, setTrades] = useState<InsiderTrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async (force = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await marketDataService.fetchInsiderTrades(force);
            setTrades(data);
        } catch (err: any) {
            console.error("InsiderRadar Load Error:", err);
            // Fallback to Mock Data on Error so UI isn't empty
            setTrades(marketDataService.getMockInsider());

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
                <ShieldAlert size={80} className={`text-indigo-500 ${error ? 'text-amber-500' : ''}`} />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Insider Radar</h3>
                        <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                            TRACKING PROMOTER ACTIVITY
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {marketDataService.isLive() && (
                        <button
                            onClick={handleRefresh}
                            className={`p-1 hover:bg-slate-800 rounded transition-colors ${error ? 'text-rose-400' : 'text-slate-500 hover:text-indigo-400'}`}
                            title="Refresh Data (Uses Quota)"
                        >
                            <Clock size={14} />
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

            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    trades.map((trade) => (
                        <div key={trade.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/30 transition-all group/item">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{trade.ticker}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {trade.type}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Clock size={10} /> {trade.date}
                                </span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">{trade.person}</p>
                                    <p className="text-[10px] text-slate-500">{trade.relation}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(trade.value)}</p>
                                    <p className="text-[10px] text-slate-500">{trade.mode}</p>
                                </div>
                            </div>

                            <div className="mt-2 h-0.5 w-full bg-slate-700/50 overflow-hidden rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <div className={`h-full ${trade.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'} w-full animate-progress`}></div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="w-full mt-4 shrink-0 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                View Full Filing History <ArrowRight size={12} />
            </button>
        </div>
    );
};

export default InsiderRadar;
