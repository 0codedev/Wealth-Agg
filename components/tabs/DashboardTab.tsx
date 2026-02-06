import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
    TrendingUp, TrendingDown, Target,
    Wallet, Coins, Gauge, Plus, LayoutList, Table as TableIcon,
    Filter, Layers, RefreshCw, ArrowUpRight, Search, PieChart, Bot, Circle, Dot, Scale, X,
    Activity, History, Clock, Trophy, Crosshair, Flame, Pencil, CheckCircle2, FileText
} from 'lucide-react';
import { Investment, AggregatedData, CHART_COLORS } from '../../types';
import * as AIService from '../../services/aiService';
import { calculateProgress5L, getCountdownToTarget } from '../../utils/helpers';
import { MarketStatus } from '../../hooks/useMarketSentiment';
import { useSettingsStore } from '../../store/settingsStore';
import { LifeEvent } from '../../database';
import { generateMonthlyReport } from '../../services/ReportService';
import { logger } from '../../services/Logger';
import { ErrorBoundary } from '../ErrorBoundary';

// New Components
import CommandCenter from '../dashboard/CommandCenter';
import HeroSection from '../dashboard/HeroSection';
import WealthSimulator from '../dashboard/WealthSimulator';
const FinancialCalendar = lazy(() => import('../dashboard/widgets/FinancialCalendar'));
const HeatmapWidget = lazy(() => import('../dashboard/widgets/HeatmapWidget'));
import WidgetSkeleton from '../shared/WidgetSkeleton';
import {
    TotalPLWidget, TopPerformerWidget, LoanWidgetWrapper,
    Project5LWidget, ExposureChartWidget, PlatformChartWidget,
    SpendingWidget, MarketWidget, CommunityWidget
} from '../dashboard/StandardWidgets';
import TaxHarvestingWidget from '../dashboard/widgets/TaxHarvestingWidget';
import { DashboardGrid } from '../dashboard/DashboardGrid';
import { AlphaTicker } from '../dashboard/AlphaTicker';
import ReportGenerationModal from '../reports/ReportGenerationModal';
import DataHealthHub from '../data/DataHealthHub';

// God-Tier Widgets
import {
    BankStatementParser,
    UPITrackerWidget,
    CreditCardOptimizer,
    NewsSentimentWidget,
    InvestmentClubsWidget,
    ChallengesWidget,
    SharePortfolioButton,
    PeerComparisonWidget
} from '../shared/GodTierFeatures';

import { SpendingAnalyticsHub } from '../dashboard/hubs/SpendingAnalyticsHub';
import { MarketInsightsHub } from '../dashboard/hubs/MarketInsightsHub';
import { CommunityHub } from '../dashboard/hubs/CommunityHub';
const AlertsManager = lazy(() => import('../dashboard/widgets/AlertsManager'));
import OracleHub from '../dashboard/hubs/OracleHub';
const FortressHub = lazy(() => import('../dashboard/hubs/FortressHub'));
const Project5LWidgetEnhanced = lazy(() => import('../dashboard/widgets/Project5LWidget'));
const AICopilotWidget = lazy(() => import('../dashboard/widgets/AICopilotWidget'));
const FIREDashboardWidget = lazy(() => import('../dashboard/widgets/FIREDashboardWidget'));
const CorrelationMatrixWidget = lazy(() => import('../dashboard/widgets/CorrelationMatrixWidget'));
const RebalancingWizard = lazy(() => import('../dashboard/widgets/RebalancingWizard'));
const SmartActionsWidget = lazy(() => import('../dashboard/widgets/SmartActionsWidget'));
import { RunwayGauge } from '../dashboard/RunwayGauge';
import { LiabilityWatchdogWidget } from '../dashboard/widgets/LiabilityWatchdogWidget';
import { GoalThermometer } from '../dashboard/widgets/GoalThermometer';
const MilestoneTimelineWidget = lazy(() => import('../dashboard/widgets/MilestoneTimelineWidget'));



// Type-safe Portfolio Stats interface
interface PortfolioStats {
    totalInvested: number;
    totalCurrent: number;
    totalValue?: number;
    totalPL: number;
    totalPLPercent: number | string; // Can be string from toFixed()
    loanBalance?: number;
    investmentCount?: number;
    totalAssets?: number;
    diversityScore?: number;
    [key: string]: any; // Allow additional properties from App.tsx
}

interface DashboardTabProps {
    investments: Investment[];
    stats: PortfolioStats;
    allocationData: AggregatedData[];
    assetClassData: AggregatedData[];
    platformData: AggregatedData[];
    projectionData: any[]; // Kept for interface compatibility but we compute dynamic inside
    isPrivacyMode: boolean;
    isDarkMode: boolean;
    onAddFirstAsset: () => void;
    formatCurrency: (val: number) => string;
    formatCurrencyPrecise: (val: number) => string;
    calculatePercentage: (part: number, total: number) => string;
    ASSET_CLASS_COLORS: Record<string, string>;
    CustomTooltip: React.ComponentType<any>;
    marketVix: number;
    marketStatus: MarketStatus;
    // Synced Life Events
    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id'>) => Promise<void>;
    deleteLifeEvent: (id: number) => Promise<void>;
    history: { date: string, value: number }[];
    // Controlled View State
    view: 'MAIN' | 'SPENDING' | 'MARKETS' | 'COMMUNITY';
    onViewChange: (view: 'MAIN' | 'SPENDING' | 'MARKETS' | 'COMMUNITY') => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    investments, stats, allocationData, assetClassData, platformData,
    projectionData, isPrivacyMode, isDarkMode, onAddFirstAsset,
    formatCurrency, formatCurrencyPrecise, calculatePercentage,
    ASSET_CLASS_COLORS, CustomTooltip, marketVix, marketStatus,
    lifeEvents, addLifeEvent, deleteLifeEvent, history,
    view, onViewChange
}) => {
    // Global Toggle State: false = Gross, true = Net
    const [showNetWorth, setShowNetWorth] = useState(false);

    // Dynamic Projection based on Toggle
    const dynamicProjectionData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startValue = showNetWorth ? (stats?.totalValue || 0) : (stats?.totalAssets || 0);

        // Generate 10 years of data (Monte Carlo styled)
        return Array.from({ length: 11 }, (_, i) => {
            const year = currentYear + i;
            // Base: 12% | Bull: 18% | Bear: 6% CAGR
            return {
                date: year.toString(),
                base: Math.round(startValue * Math.pow(1.12, i)),
                bull: Math.round(startValue * Math.pow(1.18, i)),
                bear: Math.round(startValue * Math.pow(1.06, i)),
                eventMarker: i === 3 || i === 7 // Mock markers
            };
        });
    }, [stats, showNetWorth]);

    // --- TIME TRAVELER STATE ---
    const [timeTravelIndex, setTimeTravelIndex] = useState<number>(0);
    const { targetNetWorth, targetDate, isEditMode } = useSettingsStore();

    // Initialize Time Traveler to Present
    useEffect(() => {
        if (history && history.length > 0) {
            setTimeTravelIndex(history.length);
        }
    }, [history?.length]);

    const dynamicHealthScore = useMemo(() => {
        const dScore = (stats?.diversityScore || 0) * 0.5;
        const pScore = (stats?.totalPLPercent ? Math.min(100, 50 + parseFloat(String(stats.totalPLPercent))) : 50) * 0.5;
        return Math.min(100, Math.round(dScore + pScore));
    }, [stats]);

    const [showReportModal, setShowReportModal] = useState(false);
    const [showHealthHub, setShowHealthHub] = useState(false);

    // --- TIME TRAVELER LOGIC ---
    const timeTravelData = useMemo(() => {
        const totalPoints = (history?.length || 0) + 1 + (projectionData?.length || 0); // Past + Present + Future
        const currentIndex = history?.length || 0;

        // Detailed State Logic
        let type = 'PRESENT';
        let value = stats?.totalCurrent || 0;
        let date = 'Today';

        if (timeTravelIndex < currentIndex) {
            const h = history[timeTravelIndex];
            type = 'PAST';
            value = h?.value || 0;
            date = h?.date || 'Past';
        } else if (timeTravelIndex > currentIndex) {
            const pIndex = timeTravelIndex - currentIndex - 1;
            const p = projectionData[pIndex];
            type = 'FUTURE';
            value = p?.amount || 0;
            date = p?.year ? `Year ${p.year}` : 'Future';
        }

        return { totalPoints, currentIndex, type, value, date };
    }, [history, projectionData, timeTravelIndex, stats.totalCurrent]);

    const isPresent = timeTravelIndex === (history?.length || 0);

    // --- DRAGGABLE GRID STATE ---
    const DEFAULT_WIDGETS = [
        'market-widget', 'community-widget', 'spending-widget',
        'calendar',
        'wealth-simulator',
        'tax-harvesting', 'total-pl', 'top-performer', 'loan-widget',
        'project-5l', 'exposure-chart', 'platform-chart',
        'heatmap', 'alerts-widget',
        'fortress-hub',
        'ai-copilot', 'fire-dashboard', 'correlation-matrix', 'rebalancing-wizard',
        'runway-gauge', 'liability-watchdog',
        'goal-thermometer',
        'smart-actions-widget',
        'milestone-timeline'
    ];

    const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard-widget-order-v8');
            return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
        } catch {
            return DEFAULT_WIDGETS;
        }
    });

    useEffect(() => {
        if (widgetOrder.length < DEFAULT_WIDGETS.length) {
            setWidgetOrder(DEFAULT_WIDGETS);
        }
    }, [DEFAULT_WIDGETS.length]);

    useEffect(() => {
        if (widgetOrder.length < DEFAULT_WIDGETS.length) {
            setWidgetOrder(DEFAULT_WIDGETS);
        }
    }, [DEFAULT_WIDGETS.length]);

    // Registry for Widgets
    const renderWidget = (id: string) => {
        const commonProps = { dragHandle: isEditMode };

        switch (id) {
            case 'total-pl':
                return (
                    <ErrorBoundary key={id}>
                        <TotalPLWidget id={id} {...commonProps} stats={stats} isPrivacyMode={isPrivacyMode} formatCurrency={formatCurrency} formatCurrencyPrecise={formatCurrencyPrecise} />
                    </ErrorBoundary>
                );
            case 'top-performer':
                return (
                    <ErrorBoundary key={id}>
                        <TopPerformerWidget id={id} {...commonProps} stats={stats} investments={investments} calculatePercentage={calculatePercentage} />
                    </ErrorBoundary>
                );
            case 'loan-widget':
                return (
                    <ErrorBoundary key={id}>
                        <LoanWidgetWrapper id={id} {...commonProps} />
                    </ErrorBoundary>
                );
            case 'project-5l':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Project 5L" />}>
                                <Project5LWidgetEnhanced
                                    currentWealth={showNetWorth ? (stats?.totalValue || 0) : (stats?.totalAssets || 0)}
                                    targetWealth={targetNetWorth}
                                    monthlyContribution={25000}
                                    expectedReturn={12}
                                    isNetWorth={showNetWorth}
                                />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'exposure-chart':
                // Using assetClassData for "Asset Type" view
                return (
                    <ErrorBoundary key={id}>
                        <ExposureChartWidget id={id} {...commonProps} allocationData={assetClassData} investments={investments} CustomTooltip={CustomTooltip} isPrivacyMode={isPrivacyMode} formatCurrency={formatCurrency} calculatePercentage={calculatePercentage} />
                    </ErrorBoundary>
                );
            case 'platform-chart':
                return (
                    <ErrorBoundary key={id}>
                        <PlatformChartWidget id={id} {...commonProps} platformData={platformData} isDarkMode={isDarkMode} isPrivacyMode={isPrivacyMode} CustomTooltip={CustomTooltip} />
                    </ErrorBoundary>
                );
            case 'tax-harvesting':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full min-h-[300px]">
                            <TaxHarvestingWidget investments={investments} />
                        </div>
                    </ErrorBoundary>
                );
            case 'fortress-hub':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Fortress Hub" />}>
                                <FortressHub />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'spending-widget':
                return (
                    <ErrorBoundary key={id}>
                        <SpendingWidget id={id} {...commonProps} onClick={() => onViewChange('SPENDING')} />
                    </ErrorBoundary>
                );
            case 'market-widget':
                return (
                    <ErrorBoundary key={id}>
                        <MarketWidget id={id} {...commonProps} onClick={() => onViewChange('MARKETS')} />
                    </ErrorBoundary>
                );
            case 'community-widget':
                return (
                    <ErrorBoundary key={id}>
                        <CommunityWidget id={id} {...commonProps} onClick={() => onViewChange('COMMUNITY')} />
                    </ErrorBoundary>
                );
            case 'calendar':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full min-h-[400px]">
                            <Suspense fallback={<WidgetSkeleton title="Financial Calendar" />}>
                                <FinancialCalendar investments={investments} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'wealth-simulator':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <WealthSimulator projectionData={dynamicProjectionData} isDarkMode={isDarkMode} formatCurrency={formatCurrency} />
                        </div>
                    </ErrorBoundary>
                );
            case 'smart-actions-widget':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Smart Actions" />}>
                                <SmartActionsWidget onQuickAction={(action) => logger.debug('Smart Action triggered', { action }, 'DashboardTab')} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'heatmap':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full min-h-[400px]">
                            <Suspense fallback={<WidgetSkeleton title="Market Heatmap" />}>
                                <HeatmapWidget history={history} isDarkMode={isDarkMode} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'alerts-widget':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Alerts" />}>
                                <AlertsManager investments={investments} formatCurrency={formatCurrency} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'ai-copilot':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="AI Copilot" />}>
                                <AICopilotWidget formatCurrency={formatCurrency} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'fire-dashboard':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="FIRE Dashboard" />}>
                                <FIREDashboardWidget stats={stats} formatCurrency={formatCurrency} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'correlation-matrix':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Correlation Matrix" />}>
                                <CorrelationMatrixWidget investments={investments} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'rebalancing-wizard':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Rebalancing Wizard" />}>
                                <RebalancingWizard investments={investments} />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            case 'runway-gauge':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <RunwayGauge />
                        </div>
                    </ErrorBoundary>
                );
            case 'liability-watchdog':
                return (
                    <ErrorBoundary key={id}>
                        <div className={`h-full transition-opacity duration-300 ${!showNetWorth ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            <LiabilityWatchdogWidget />
                        </div>
                    </ErrorBoundary>
                );
            case 'goal-thermometer':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <GoalThermometer currentNetWorth={stats?.totalCurrent} />
                        </div>
                    </ErrorBoundary>
                );
            case 'milestone-timeline':
                return (
                    <ErrorBoundary key={id}>
                        <div className="h-full">
                            <Suspense fallback={<WidgetSkeleton title="Milestone Timeline" />}>
                                <MilestoneTimelineWidget
                                    lifeEvents={lifeEvents}
                                    addLifeEvent={addLifeEvent}
                                    deleteLifeEvent={deleteLifeEvent}
                                />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                );
            default:
                return null;
        }
    };
    if (view === 'SPENDING') {
        return (
            <SpendingAnalyticsHub
                onBack={() => onViewChange('MAIN')}
                formatCurrency={formatCurrency}
            />
        );
    }

    if (view === 'MARKETS') {
        return (
            <MarketInsightsHub
                onBack={() => onViewChange('MAIN')}
                stats={stats}
                investments={investments}
            />
        );
    }

    if (view === 'COMMUNITY') {
        return (
            <CommunityHub
                onBack={() => onViewChange('MAIN')}
                investments={investments}
                stats={stats}
                assetClassData={assetClassData}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">

            {/* Actions Bar */}
            <div className="flex justify-end px-2 gap-2">
                <button
                    onClick={() => setShowHealthHub(!showHealthHub)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                >
                    <Activity size={14} />
                    Data Health
                </button>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                >
                    <FileText size={14} />
                    Generate Report
                </button>
            </div>

            {showHealthHub && (
                <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                    <DataHealthHub onClose={() => setShowHealthHub(false)} />
                </div>
            )}

            <CommandCenter marketStatus={marketStatus} marketVix={marketVix} />
            <AlphaTicker />

            {investments.length > 0 && (
                <>
                    {/* TIME TRAVELER HEADER OR HERO */}
                    {!isPresent ? (
                        <div className={`rounded-2xl p-8 shadow-xl border-2 transition-all duration-500 relative overflow-hidden ${timeTravelData.type === 'PAST' ? 'bg-slate-900 border-slate-700' : 'bg-indigo-950 border-indigo-500'}`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                {timeTravelData.type === 'PAST' ? <History size={120} className="text-white" /> : <Target size={120} className="text-indigo-400" />}
                            </div>
                            <div className="relative z-10 text-center">
                                <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${timeTravelData.type === 'PAST' ? 'text-slate-400' : 'text-indigo-300'}`}>
                                    {timeTravelData.type === 'PAST' ? 'Historical Snapshot' : 'Future Projection'}
                                </p>
                                <h2 className="text-5xl font-black text-white mb-2">
                                    {isPrivacyMode ? '••••••' : formatCurrency(timeTravelData.value)}
                                </h2>
                                <p className="text-lg font-medium text-white/70">
                                    {timeTravelData.date}
                                </p>
                                <button
                                    onClick={() => setTimeTravelIndex(history?.length || 0)}
                                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold backdrop-blur-sm transition-colors"
                                >
                                    Return to Present
                                </button>
                            </div>
                        </div>
                    ) : (
                        <HeroSection
                            stats={stats}
                            isPrivacyMode={isPrivacyMode}
                            dynamicHealthScore={dynamicHealthScore}
                            formatCurrency={formatCurrency}
                            lifeEvents={lifeEvents}
                            addLifeEvent={addLifeEvent}
                            deleteLifeEvent={deleteLifeEvent}
                            showLiability={showNetWorth}
                            setShowLiability={setShowNetWorth}
                        />
                    )}

                    {/* TIME TRAVELER SLIDER */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><History size={12} /> Past</span>
                                <span className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1">Time Traveler <Clock size={12} /></span>
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">Future <Target size={12} /></span>
                            </div>

                            <button
                                onClick={() => generateMonthlyReport({ investments, stats, allocationData })}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors"
                            >
                                <ArrowUpRight size={12} /> Report
                            </button>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={(history?.length || 0) + (projectionData?.length || 0)}
                            value={timeTravelIndex}
                            onChange={(e) => setTimeTravelIndex(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Only show widgets if in Present Mode */}
                    {isPresent && (
                        <>
                            {/* EDIT MODE BANNER */}
                            {isEditMode && (
                                <div className="bg-indigo-600 text-white p-2 rounded-lg text-center text-sm font-bold mb-4 animate-in fade-in slide-in-from-top-2">
                                    Edit Mode Active – Drag widgets to reorder
                                </div>
                            )}

                            <DashboardGrid renderWidget={renderWidget} />
                        </>
                    )}
                </>
            )
            }

            {
                investments.length === 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4"><PieChart size={32} /></div><h3 className="text-lg font-semibold text-slate-900 dark:text-white">No investment data found</h3><button onClick={onAddFirstAsset} className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"><Plus size={20} /> Add First Asset</button></div>
                )
            }

            {/* Report Modal */}
            <ReportGenerationModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                currentStats={stats}
                investments={investments}
                allocationData={allocationData}
            />
        </div >
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(DashboardTab);