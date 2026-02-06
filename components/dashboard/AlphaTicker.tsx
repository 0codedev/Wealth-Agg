import React, { useState, useEffect, useCallback } from 'react';
import { Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, Wifi, WifiOff } from 'lucide-react';
import { fetchIndianIndices, fetchIndiaVIX, hasAnyApiKey, MarketQuote, MacroIndicator } from '../../services/RealDataService';
import { logger } from '../../services/Logger';

interface TickerItem {
    id: string;
    type: 'MARKET' | 'INSIGHT' | 'ALERT';
    text: string;
    value?: string;
    change?: number; // percentage
    isLive?: boolean;
}

// Fallback mock data
const MOCK_TICKER_ITEMS: TickerItem[] = [
    { id: '1', type: 'MARKET', text: 'NIFTY 50', value: '24,850', change: 0.45, isLive: false },
    { id: '2', type: 'MARKET', text: 'SENSEX', value: '81,200', change: -0.12, isLive: false },
    { id: '3', type: 'INSIGHT', text: 'Tech sector showing overbought signals (RSI > 75)', change: 0 },
    { id: '4', type: 'ALERT', text: 'HDFC Bank crossed 52-week high', change: 1.2 },
    { id: '5', type: 'MARKET', text: 'INDIA VIX', value: '14.20', change: -0.5, isLive: false },
    { id: '6', type: 'INSIGHT', text: 'Midcap index outperforming large caps by 2.5% this week', change: 0 },
    { id: '7', type: 'ALERT', text: 'SIP deducted for "Retirement Goal": ₹25,000', change: 0 },
];

// Format number for display
function formatPrice(value: number): string {
    if (value >= 10000) {
        return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
}

export const AlphaTicker: React.FC = () => {
    const [tickerItems, setTickerItems] = useState<TickerItem[]>(MOCK_TICKER_ITEMS);
    const [isLiveData, setIsLiveData] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchLiveData = useCallback(async () => {
        try {
            const hasKeys = hasAnyApiKey();
            logger.debug('AlphaTicker: Fetching data, has API keys:', hasKeys);

            // Fetch indices and VIX
            const [indices, vix] = await Promise.all([
                fetchIndianIndices(),
                fetchIndiaVIX()
            ]);

            // Check if we got live data
            const hasLiveData = indices.some(i => i.source !== 'mock') || vix.source !== 'mock';
            setIsLiveData(hasLiveData);

            // Build new ticker items
            const newItems: TickerItem[] = [];

            // Add indices
            for (const quote of indices) {
                newItems.push({
                    id: quote.symbol,
                    type: 'MARKET',
                    text: quote.name,
                    value: formatPrice(quote.price),
                    change: quote.changePercent,
                    isLive: quote.source !== 'mock'
                });
            }

            // Add VIX
            newItems.push({
                id: 'indiavix',
                type: 'MARKET',
                text: 'INDIA VIX',
                value: formatPrice(vix.value),
                change: vix.change,
                isLive: vix.source !== 'mock'
            });

            // Keep insights and alerts from mock data
            const staticItems = MOCK_TICKER_ITEMS.filter(item => item.type !== 'MARKET');

            setTickerItems([...newItems, ...staticItems]);
            setLastUpdate(new Date());

            logger.debug(`AlphaTicker: Updated with ${newItems.length} market items, live: ${hasLiveData}`);
        } catch (error) {
            logger.warn('AlphaTicker: Failed to fetch live data', error);
            // Keep current items on error
        }
    }, []);

    // Initial fetch and refresh interval
    useEffect(() => {
        fetchLiveData();

        // Refresh every 5 minutes
        const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    return (
        <div className="w-full bg-slate-900 text-white overflow-hidden py-2 border-b border-slate-800 relative z-40">
            {/* Live indicator */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
                {isLiveData ? (
                    <Wifi size={12} className="text-emerald-400" />
                ) : (
                    <WifiOff size={12} className="text-slate-500" />
                )}
            </div>

            <div className="flex whitespace-nowrap animate-ticker hover:[animation-play-state:paused] ml-6">
                {/* Double the items for seamless loop */}
                {[...tickerItems, ...tickerItems].map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-2 mx-6 text-xs font-mono">
                        {item.type === 'MARKET' && (
                            <span className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-400">{item.text}</span>
                                <span className={item.change && item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    {item.value}
                                </span>
                                {item.change !== undefined && (
                                    <span className={`flex items-center ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {Math.abs(item.change).toFixed(2)}%
                                    </span>
                                )}
                                {item.isLive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live data" />
                                )}
                            </span>
                        )}

                        {item.type === 'INSIGHT' && (
                            <span className="flex items-center gap-1.5 text-indigo-300">
                                <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                                <span>{item.text}</span>
                            </span>
                        )}

                        {item.type === 'ALERT' && (
                            <span className="flex items-center gap-1.5 text-slate-300">
                                <AlertTriangle size={12} className="text-amber-500" />
                                <span>{item.text}</span>
                                {item.change && item.change > 0 && (
                                    <span className="text-emerald-400 flex items-center">
                                        <ArrowUpRight size={12} /> {item.change}%
                                    </span>
                                )}
                            </span>
                        )}

                        <span className="text-slate-700 ml-4">|</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker 40s linear infinite;
                }
            `}</style>
        </div>
    );
};
