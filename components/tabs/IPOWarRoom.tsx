// IPO War Room - HMR Trigger
import React, { useState, useMemo, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle2, XCircle,
    Search, Banknote, Users, AlertOctagon,
    ThumbsDown, ThumbsUp, Calendar, Zap, Calculator,
    BarChart3, ArrowRight, MousePointerClick,
    Activity, TrendingUp, LayoutGrid, List,
    Briefcase, CandlestickChart, Scale
} from 'lucide-react';
import { Investment, InvestmentType } from '../../types';
import { db, IPOApplication } from '../../database';
import SyndicateTracker from '../SyndicateTracker';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../utils/helpers';
import PasteParserModal from '../PasteParserModal';
import DemandHeatmap from './ipo/DemandHeatmap';
import ProbabilityEngine from './ipo/ProbabilityEngine';
import FlippersMatrix from './ipo/FlippersMatrix';

export interface IPOWarRoomProps {
    investments?: Investment[];
    onRefresh?: () => void;
}

// Mock Data for "Quick Fill" Feature
const IPO_PRESETS = [
    { name: 'NTPC Green', fresh: 100, promoter: 85, litigation: 2, pe: 45, gmp: 8, sub: 2.5, qib: 3.2, nii: 4.5, retail: 1.8 },
    { name: 'Swiggy', fresh: 45, promoter: 0, litigation: 12, pe: -1, gmp: 2, sub: 1.1, qib: 1.5, nii: 0.8, retail: 0.9 },
    { name: 'Hyundai India', fresh: 0, promoter: 100, litigation: 5, pe: 26, gmp: 5, sub: 2.3, qib: 6.9, nii: 0.6, retail: 0.5 },
    { name: 'Zomato (Hist)', fresh: 100, promoter: 0, litigation: 1, pe: -1, gmp: 55, sub: 40, qib: 52, nii: 35, retail: 8 },
];

const IPOWarRoom: React.FC<IPOWarRoomProps> = ({ investments = [], onRefresh }) => {
    const [activeSubTab, setActiveSubTab] = useState<'WAR_ROOM' | 'SYNDICATE'>('WAR_ROOM');

    // Luck Stats State
    const [luckStats, setLuckStats] = useState({ total: 0, wins: 0, ratio: 0 });

    // --- Feature 1: The 7-Point Scan State ---
    const [freshIssue, setFreshIssue] = useState<number | ''>('');
    const [promoterHolding, setPromoterHolding] = useState<number | ''>('');
    const [litigationCount, setLitigationCount] = useState<number | ''>('');
    const [peRatio, setPeRatio] = useState<number | ''>('');

    // --- Feature 2: GMP Validator State ---
    const [currentGmp, setCurrentGmp] = useState<number | ''>('');
    const [subProb, setSubProb] = useState<number | ''>('');

    // --- Feature 3: Probability Engine (Linked to Retail Sub) ---
    // Removed standalone subscriptionX state to enforce "Retail Only" logic

    // --- Feature 4: Quota ---
    const [isParentShareholder, setIsParentShareholder] = useState(false);

    // --- Feature 5: Demand Heatmap (Task 9) ---
    const [qibSub, setQibSub] = useState<number | ''>('');
    const [niiSub, setNiiSub] = useState<number | ''>('');
    const [retailSub, setRetailSub] = useState<number | ''>('');

    // --- Feature 7: Listing Strategy Generator ---
    const [stratIssuePrice, setStratIssuePrice] = useState<number | ''>('');
    const [stratListPrice, setStratListPrice] = useState<number | ''>('');

    // Dynamic Settings
    const ipoFreshIssueThreshold = useSettingsStore(state => state.ipoFreshIssueThreshold);

    // --- Paste Parser State ---
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

    const handleParsedData = (data: any) => {
        if (data.fresh) setFreshIssue(data.fresh);
        if (data.promoter) setPromoterHolding(data.promoter);
        if (data.gmp) setCurrentGmp(data.gmp);
        // Map general 'sub' to 'retailSub' if specific 'retail' is missing, or prefer 'retail'
        if (data.retail) setRetailSub(data.retail);
        else if (data.sub) setRetailSub(data.sub);

        if (data.qib) setQibSub(data.qib);
        if (data.nii) setNiiSub(data.nii);
    };

    // --- Fetch Luck Data ---
    const fetchLuckStats = async () => {
        try {
            const apps = await db.ipo_applications.toArray();
            // Considered "Closed" applications only
            const closedApps = apps.filter(app => ['ALLOTTED', 'REFUNDED', 'LISTED'].includes(app.status));
            const totalClosed = closedApps.length;
            const wins = closedApps.filter(app => ['ALLOTTED', 'LISTED'].includes(app.status)).length;
            const ratio = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

            setLuckStats({ total: totalClosed, wins, ratio });
        } catch (e) { console.error("Luck fetch error", e); }
    };

    useEffect(() => {
        fetchLuckStats();
    }, []); // Initial load

    const handleDataChange = () => {
        fetchLuckStats();
    };

    // --- Logic ---
    const isLiquidityRisk = freshIssue !== '' && Number(freshIssue) < ipoFreshIssueThreshold;
    const isSkipSignal = (retailSub !== '' && currentGmp !== '') && (Number(retailSub) < 1 && Number(currentGmp) < 20);
    const isGoodGmp = currentGmp !== '' && Number(currentGmp) > 50;



    // Listing Strategy Logic
    const listingStrategy = useMemo(() => {
        if (!stratIssuePrice || !stratListPrice) return null;

        const gain = stratListPrice - stratIssuePrice;
        const gainPct = (gain / stratIssuePrice) * 100;

        let title = "";
        let desc = "";
        let color = "";

        if (gainPct < 0) {
            title = "CAPITAL PROTECTION";
            desc = "Listing at Discount. Exit immediately to preserve capital. Do not average down on listing day.";
            color = "text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-900/20";
        } else if (gainPct < 10) {
            title = "STOP LOSS TIGHT";
            desc = "Flat Listing. Place SL at Issue Price. Exit if a 5-min candle closes below Issue Price.";
            color = "text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-900/20";
        } else if (gainPct < 40) {
            title = "BOOK & TRAIL";
            desc = "Moderate Listing. Sell 50% quantity to release capital. Trail the rest with SL at Day's Low.";
            color = "text-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20";
        } else {
            title = "RIDE THE WAVE";
            desc = "Blockbuster Listing. Hold. Trail SL to Opening Price. Watch for Upper Circuit Freeze.";
            color = "text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
        }

        return { title, desc, color, gainPct };
    }, [stratIssuePrice, stratListPrice]);



    const totalCash = investments
        .filter(i => i.type === InvestmentType.CASH || i.type === InvestmentType.FD)
        .reduce((acc, curr) => acc + curr.currentValue, 0);

    const applyPreset = (preset: typeof IPO_PRESETS[0]) => {
        setFreshIssue(preset.fresh);
        setPromoterHolding(preset.promoter);
        setLitigationCount(preset.litigation);
        setPeRatio(preset.pe);
        setCurrentGmp(preset.gmp);
        // setSubscriptionX(preset.sub); // Removed
        setQibSub(preset.qib);
        setNiiSub(preset.nii);
        setRetailSub(preset.retail);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">

            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {activeSubTab === 'WAR_ROOM' ? (
                                <>
                                    <AlertOctagon className="text-emerald-400" size={28} />
                                    IPO War Room
                                </>
                            ) : (
                                <>
                                    <Users className="text-indigo-400" size={28} />
                                    Syndicate Tracker
                                </>
                            )}
                        </h2>
                        <p className="text-slate-400 mt-1">
                            {activeSubTab === 'WAR_ROOM' ? 'Forensic DRHP Analyzer & Syndicate Tracker.' : 'Manage Family Applications & Track Mandates.'}
                        </p>
                    </div>

                    {/* Sub-Tab Toggle */}
                    <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setActiveSubTab('WAR_ROOM')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'WAR_ROOM' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutGrid size={16} /> War Room
                        </button>
                        <button
                            onClick={() => setActiveSubTab('SYNDICATE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'SYNDICATE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users size={16} /> Syndicate Tracker
                        </button>
                    </div>
                </div>
            </div>

            {activeSubTab === 'SYNDICATE' ? (
                <SyndicateTracker
                    totalCash={totalCash}
                    onPortfolioRefresh={onRefresh}
                    onDataChange={handleDataChange}
                />
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    {/* Quick Fill Presets */}
                    <div className="w-full flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500 uppercase mr-2 flex items-center gap-1">
                            <Zap size={12} /> Quick Load:
                        </span>
                        {IPO_PRESETS.map(p => (
                            <button
                                key={p.name}
                                onClick={() => applyPreset(p)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 group"
                            >
                                <MousePointerClick size={12} className="opacity-50 group-hover:opacity-100" />
                                {p.name}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setIsPasteModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-600 dark:text-indigo-400 font-bold transition-colors flex items-center gap-1"
                        >
                            <Zap size={12} /> Magic Paste
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* FEATURE 5: DEMAND HEATMAP & RADAR */}
                        <DemandHeatmap
                            qibSub={qibSub}
                            setQibSub={setQibSub}
                            niiSub={niiSub}
                            setNiiSub={setNiiSub}
                            retailSub={retailSub}
                            setRetailSub={setRetailSub}
                            currentGmp={Number(currentGmp)}
                            subscriptionX={Number(retailSub)} // LINKED: Radar now uses Retail Sub for X-Axis
                        />

                        {/* FEATURE 1: PROBABILITY ENGINE */}
                        <ProbabilityEngine
                            subscriptionX={retailSub} // LINKED: Probability now uses Retail Sub
                            setSubscriptionX={setRetailSub}
                            luckStats={luckStats}
                        />

                        {/* FEATURE 6: FLIPPER'S MATRIX (NEW) */}
                        <FlippersMatrix />

                        {/* FEATURE 7: LISTING STRATEGY GENERATOR (NEW) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <CandlestickChart size={20} className="text-fuchsia-500" /> Listing Strategy
                                </h3>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Issue Price</label>
                                    <input
                                        type="number"
                                        value={stratIssuePrice}
                                        onChange={(e) => setStratIssuePrice(parseFloat(e.target.value) || '')}
                                        placeholder="0"
                                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:border-fuchsia-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Open Price</label>
                                    <input
                                        type="number"
                                        value={stratListPrice}
                                        onChange={(e) => setStratListPrice(parseFloat(e.target.value) || '')}
                                        placeholder="0"
                                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold outline-none focus:border-fuchsia-500"
                                    />
                                </div>
                            </div>

                            {listingStrategy ? (
                                <div className={`flex-1 p-4 rounded-xl border-2 ${listingStrategy.color} animate-in zoom-in duration-300`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-black tracking-tight uppercase">{listingStrategy.title}</h4>
                                        <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded">
                                            {listingStrategy.gainPct > 0 ? '+' : ''}{listingStrategy.gainPct.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium opacity-90 leading-relaxed">
                                        {listingStrategy.desc}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                                    <Scale size={24} className="mb-2 opacity-50" />
                                    <p className="text-xs">Enter prices to generate strategy</p>
                                </div>
                            )}
                        </div>

                        {/* FEATURE 2: THE 7-POINT SCAN */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Search size={20} className="text-indigo-600 dark:text-indigo-500" /> The 7-Point Scan
                                </h3>
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                                    Forensic Data
                                </span>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Fresh Issue % (vs OFS)</label>
                                        {freshIssue !== '' && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLiquidityRisk ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {isLiquidityRisk ? 'EXIT LIQUIDITY' : 'GROWTH CAP'}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={freshIssue}
                                        onChange={(e) => setFreshIssue(parseFloat(e.target.value) || '')}
                                        placeholder="e.g. 65"
                                        className={`w-full p-3 rounded-lg border bg-slate-50 dark:bg-slate-950 outline-none transition-all ${isLiquidityRisk ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Promoter Holding %</label>
                                        <input
                                            type="number"
                                            value={promoterHolding}
                                            onChange={(e) => setPromoterHolding(parseFloat(e.target.value) || '')}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Litigation Count</label>
                                        <input
                                            type="number"
                                            value={litigationCount}
                                            onChange={(e) => setLitigationCount(parseFloat(e.target.value) || '')}
                                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">P/E Ratio (vs Sector)</label>
                                    <input
                                        type="number"
                                        value={peRatio}
                                        onChange={(e) => setPeRatio(parseFloat(e.target.value) || '')}
                                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* FEATURE 3: GMP VALIDATOR */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                {isSkipSignal && (
                                    <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in duration-300">
                                        <XCircle size={64} className="text-rose-500 mb-4 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                                        <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2">SKIP THIS IPO</h2>
                                        <p className="text-rose-200 font-medium">GMP is dead. Retail probability is negligible.</p>
                                        <button
                                            onClick={() => { setCurrentGmp(''); setSubProb(''); }}
                                            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
                                        >
                                            Reset Analysis
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Banknote size={20} className="text-emerald-600 dark:text-emerald-500" /> GMP Validator
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current GMP %</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={currentGmp}
                                                    onChange={(e) => setCurrentGmp(parseFloat(e.target.value) || '')}
                                                    placeholder="0"
                                                    className="w-20 bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-700"
                                                />
                                                <span className="text-slate-400">%</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-full ${isGoodGmp ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                            {isGoodGmp ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estimated Listing Gain</label>
                                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                            <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(Number(currentGmp), 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FEATURE 4: QUOTA REMINDER */}
                            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-800 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Users size={80} />
                                </div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                                    <Users size={20} className="text-blue-300" /> Shareholder Quota
                                </h3>

                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isParentShareholder}
                                            onChange={(e) => setIsParentShareholder(e.target.checked)}
                                            className="w-6 h-6 border-2 border-blue-400 rounded-md bg-transparent checked:bg-blue-400 cursor-pointer appearance-none"
                                        />
                                        {isParentShareholder && <CheckCircle2 size={16} className="absolute inset-0 m-auto text-blue-900 pointer-events-none" />}
                                    </div>
                                    <label className="text-sm font-medium text-blue-100">
                                        Are you a shareholder of the Parent Co?
                                    </label>
                                </div>

                                {isParentShareholder && (
                                    <div className="mt-4 p-3 bg-blue-950/50 border border-blue-400/30 rounded-lg flex items-start gap-3 animate-in slide-in-from-bottom-2">
                                        <Calendar className="text-blue-400 shrink-0" size={20} />
                                        <div>
                                            <p className="text-sm font-bold text-blue-200">Action Required</p>
                                            <p className="text-xs text-blue-300/80 mt-1">
                                                Verify the <strong>Record Date</strong> in the RHP. You must own at least 1 share of the parent company before this date.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <PasteParserModal
                isOpen={isPasteModalOpen}
                onClose={() => setIsPasteModalOpen(false)}
                onParse={handleParsedData}
            />
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(IPOWarRoom);
