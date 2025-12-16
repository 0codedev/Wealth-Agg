
import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import * as AIService from '../services/aiService';

const MarketTicker: React.FC = () => {
    const [marketRates, setMarketRates] = useState<{ nifty: string, gold: string, silver: string } | null>(null);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const prompt = `Get current INR price for: Nifty 50, Gold 24k (10g), Silver (1kg). Return ONLY valid JSON with keys "nifty", "gold", "silver" containing price strings.`;
                const response = await AIService.searchWeb(prompt);
                const cleanJson = response.replace(/```json|```/g, '').trim();
                try {
                    setMarketRates(JSON.parse(cleanJson));
                } catch (parseErr) { console.warn("Market data parse error", parseErr); }
            } catch (e) { console.error("Market Data Failed", e); }
        };
        fetchMarketData();
    }, []);

    return (
        <div className="w-full bg-slate-900 dark:bg-black text-slate-300 text-xs py-2 px-4 overflow-hidden whitespace-nowrap flex items-center gap-8 border-b border-slate-800 dark:border-slate-900">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Globe size={12} />
                <span>LIVE MARKETS</span>
            </div>
            {marketRates ? (
                <>
                    <span className="flex items-center gap-1">NIFTY 50 <span className="text-emerald-400 font-mono">{marketRates.nifty}</span></span>
                    <span className="flex items-center gap-1">GOLD <span className="text-amber-400 font-mono">{marketRates.gold}</span></span>
                    <span className="flex items-center gap-1">SILVER <span className="text-slate-100 font-mono">{marketRates.silver}</span></span>
                </>
            ) : (
                <div className="flex gap-8 opacity-50">
                    <span className="animate-pulse">Connecting to global exchanges...</span>
                </div>
            )}
        </div>
    );
};

export default MarketTicker;
