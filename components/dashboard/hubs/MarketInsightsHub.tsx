import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, TrendingUp, TrendingDown, BarChart3, Newspaper, Activity,
    Target, AlertTriangle, Zap, RefreshCw, ChevronRight, Globe, PieChart
} from 'lucide-react';
import { NewsSentimentWidget, PeerComparisonWidget } from '../../shared/GodTierFeatures';
import { TelegramBot } from '../../integrations/TelegramBot';
import { Investment } from '../../../types';

interface MarketInsightsHubProps {
    onBack: () => void;
    stats: any;
    investments: Investment[];
}

// Simulated real-time market data
const useMarketData = () => {
    const [data, setData] = useState({
        nifty: { value: 24850.75, change: 1.24, high: 24890, low: 24720 },
        sensex: { value: 81520.30, change: 1.18, high: 81650, low: 81200 },
        bankNifty: { value: 52340.80, change: 0.85, high: 52500, low: 52100 },
        usdinr: { value: 83.42, change: -0.12 },
        gold: { value: 72850, change: 0.45 },
        crude: { value: 5890, change: -1.23 },
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => ({
                nifty: { ...prev.nifty, value: prev.nifty.value + (Math.random() - 0.5) * 20 },
                sensex: { ...prev.sensex, value: prev.sensex.value + (Math.random() - 0.5) * 50 },
                bankNifty: { ...prev.bankNifty, value: prev.bankNifty.value + (Math.random() - 0.5) * 30 },
                usdinr: prev.usdinr,
                gold: prev.gold,
                crude: prev.crude,
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return data;
};

// Portfolio Impact Analysis Component
const PortfolioImpactAnalysis: React.FC<{ investments: Investment[], stats: any }> = ({ investments, stats }) => {
    const impacts = useMemo(() => {
        // Calculate sector-wise impact
        const sectors = [
            { name: 'IT', exposure: 35, impact: 2.5, sentiment: 'bullish' },
            { name: 'Banking', exposure: 25, impact: 1.8, sentiment: 'bullish' },
            { name: 'Pharma', exposure: 15, impact: -0.5, sentiment: 'neutral' },
            { name: 'Auto', exposure: 12, impact: 3.2, sentiment: 'bullish' },
            { name: 'FMCG', exposure: 8, impact: 0.8, sentiment: 'neutral' },
            { name: 'Others', exposure: 5, impact: 1.0, sentiment: 'neutral' },
        ];

        const overallImpact = sectors.reduce((acc, s) => acc + (s.exposure * s.impact) / 100, 0);
        const portfolioChange = (stats?.totalCurrent || 0) * (overallImpact / 100);

        return { sectors, overallImpact, portfolioChange };
    }, [investments, stats]);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 rounded-3xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                        <Target size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Portfolio Impact</h4>
                        <p className="text-xs text-blue-300/60">Real-time market effect on your portfolio</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${impacts.overallImpact >= 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                    {impacts.overallImpact >= 0 ? '+' : ''}{impacts.overallImpact.toFixed(2)}%
                </div>
            </div>

            {/* Overall Impact */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Today's Portfolio Change</span>
                    <span className={`text-lg font-black font-mono ${impacts.portfolioChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {impacts.portfolioChange >= 0 ? '+' : ''}₹{Math.abs(impacts.portfolioChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {/* Sector Impact */}
            <div className="space-y-2">
                {impacts.sectors.map((sector, idx) => (
                    <div key={sector.name} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-16">{sector.name}</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${sector.exposure}%` }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className={`h-full ${sector.impact >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                            />
                        </div>
                        <span className={`text-xs font-mono w-14 text-right ${sector.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {sector.impact >= 0 ? '+' : ''}{sector.impact}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Real-time Market Data Card
const MarketDataCard: React.FC<{ label: string; value: number; change: number; prefix?: string; suffix?: string }> =
    ({ label, value, change, prefix = '', suffix = '' }) => (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</p>
            <p className="text-lg font-black text-white font-mono">
                {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{suffix}
            </p>
            <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
            </div>
        </div>
    );

export const MarketInsightsHub: React.FC<MarketInsightsHubProps> = ({ onBack, stats, investments }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'news'>('overview');
    const market = useMarketData();
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdated(new Date()), 5000);
        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { id: 'overview', label: 'Live Data', icon: <Activity size={14} /> },
        { id: 'impact', label: 'Impact', icon: <Target size={14} /> },
        { id: 'news', label: 'News & Intel', icon: <Newspaper size={14} /> },
    ] as const;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            📈 Market Insights
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                        </h1>
                        <p className="text-sm text-slate-500">
                            Real-time data • Updated {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Market Indices */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <MarketDataCard label="NIFTY 50" value={market.nifty.value} change={market.nifty.change} />
                            <MarketDataCard label="SENSEX" value={market.sensex.value} change={market.sensex.change} />
                            <MarketDataCard label="BANK NIFTY" value={market.bankNifty.value} change={market.bankNifty.change} />
                            <MarketDataCard label="USD/INR" value={market.usdinr.value} change={market.usdinr.change} prefix="₹" />
                            <MarketDataCard label="GOLD (10g)" value={market.gold.value} change={market.gold.change} prefix="₹" />
                            <MarketDataCard label="CRUDE" value={market.crude.value} change={market.crude.change} prefix="₹" />
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 rounded-3xl border border-emerald-500/20 p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Zap size={16} className="text-emerald-400" />
                                    Market Highlights
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <span className="text-sm text-slate-300">Nifty Day Range</span>
                                        <span className="text-sm font-mono text-white">
                                            {market.nifty.low.toLocaleString()} - {market.nifty.high.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <span className="text-sm text-slate-300">Most Active</span>
                                        <span className="text-sm font-bold text-emerald-400">Reliance, TCS, HDFC</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <span className="text-sm text-slate-300">Market Mood</span>
                                        <span className="text-sm font-bold text-amber-400">📈 Bullish</span>
                                    </div>
                                </div>
                            </div>

                            <PeerComparisonWidget stats={stats} />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'impact' && (
                    <motion.div
                        key="impact"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <PortfolioImpactAnalysis investments={investments} stats={stats} />

                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 rounded-3xl border border-amber-500/20 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle size={20} className="text-amber-400" />
                                    <h4 className="text-white font-bold">Risk Alerts</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                        <p className="text-sm text-amber-200">High IT exposure (35%) - Consider rebalancing</p>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-sm text-slate-300">Global markets showing volatility</p>
                                    </div>
                                </div>
                            </div>

                            <TelegramBot investments={investments} />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'news' && (
                    <motion.div
                        key="news"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <NewsSentimentWidget />
                        <div className="space-y-6">
                            <TelegramBot investments={investments} />
                            <PeerComparisonWidget stats={stats} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

