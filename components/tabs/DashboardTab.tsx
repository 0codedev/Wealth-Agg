import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Target,
    Wallet, Coins, Gauge, Plus, LayoutList, Table as TableIcon,
    Filter, Layers, RefreshCw, ArrowUpRight, Search, PieChart, Bot, Circle, Dot, Scale, X,
    Activity, History, Clock, Trophy, Crosshair, Flame, Pencil, CheckCircle2 // Restored icons
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from '../dashboard/SortableWidget';
import { Investment, AggregatedData, CHART_COLORS } from '../../types';
import * as AIService from '../../services/aiService';
import { calculateProgress5L, getCountdownToTarget } from '../../utils/helpers';
import { MarketStatus } from '../../hooks/useMarketSentiment';
import { useSettingsStore } from '../../store/settingsStore';
import { LifeEvent } from '../../database';
import { generateMonthlyReport } from '../../services/ReportService';

// New Components
import CommandCenter from '../dashboard/CommandCenter';
import HeroSection from '../dashboard/HeroSection';
import WealthSimulator from '../dashboard/WealthSimulator';
import FinancialCalendar from '../dashboard/widgets/FinancialCalendar';
import HeatmapWidget from '../dashboard/widgets/HeatmapWidget';
import {
    TotalPLWidget, TopPerformerWidget, LoanWidgetWrapper,
    Project5LWidget, ExposureChartWidget, PlatformChartWidget,
    SpendingWidget, MarketWidget, CommunityWidget
} from '../dashboard/StandardWidgets';
import TaxHarvestingWidget from '../dashboard/widgets/TaxHarvestingWidget';

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
import AlertsManager from '../dashboard/widgets/AlertsManager';
import OracleHub from '../dashboard/hubs/OracleHub';
import FortressHub from '../dashboard/hubs/FortressHub';
import Project5LWidgetEnhanced from '../dashboard/widgets/Project5LWidget';
import AICopilotWidget from '../dashboard/widgets/AICopilotWidget';
import FIREDashboardWidget from '../dashboard/widgets/FIREDashboardWidget';
import CorrelationMatrixWidget from '../dashboard/widgets/CorrelationMatrixWidget';
import RebalancingWizard from '../dashboard/widgets/RebalancingWizard';
import SmartActionsWidget from '../dashboard/widgets/SmartActionsWidget';
import { RunwayGauge } from '../dashboard/RunwayGauge';
import { LiabilityWatchdogWidget } from '../dashboard/widgets/LiabilityWatchdogWidget';
import { GoalThermometer } from '../dashboard/widgets/GoalThermometer';



interface DashboardTabProps {
    investments: Investment[];
    stats: any;
    allocationData: AggregatedData[];
    assetClassData: AggregatedData[];
    platformData: AggregatedData[];
    projectionData: any[];
    isPrivacyMode: boolean;
    isDarkMode: boolean;
    onAddFirstAsset: () => void;
    formatCurrency: (val: number) => string;
    formatCurrencyPrecise: (val: number) => string;
    calculatePercentage: (part: number, total: number) => string;
    ASSET_CLASS_COLORS: Record<string, string>;
    CustomTooltip: any;
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
    const [aiInsight, setAiInsight] = useState<{ risk: string, tip: string } | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    // Local view state removed in favor of props

    // --- TIME TRAVELER STATE ---
    // Index 0 to history.length - 1 = Past
    // Index history.length = Present
    // Index history.length + 1 to end = Future
    const [timeTravelIndex, setTimeTravelIndex] = useState<number>(0);

    const [isTimeTraveling, setIsTimeTraveling] = useState(false);

    // --- EDIT MODE STATE ---
    // --- EDIT MODE STATE ---
    // Now controlled globally via settingsStore
    const { targetNetWorth, targetDate, isEditMode } = useSettingsStore();

    // Initialize Time Traveler to Present
    useEffect(() => {
        if (history && history.length > 0) {
            setTimeTravelIndex(history.length);
        }
    }, [history?.length]);

    const dynamicHealthScore = useMemo(() => {
        const dScore = (stats?.diversityScore || 0) * 0.5;
        const pScore = (stats?.totalPLPercent ? Math.min(100, 50 + parseFloat(stats.totalPLPercent)) : 50) * 0.5;
        return Math.min(100, Math.round(dScore + pScore));
    }, [stats]);

    // Project 5L State
    const progress5L = parseFloat(calculateProgress5L(stats?.totalAssets || 0, targetNetWorth));
    const countdown = getCountdownToTarget(targetDate);
    const isGrindMode = progress5L < 10;

    const getProgressColor = (pct: number) => {
        if (pct < 30) return 'bg-rose-500';
        if (pct < 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const progressColorClass = getProgressColor(progress5L);

    // --- TIME TRAVELER LOGIC ---
    const timeTravelData = useMemo(() => {
        const totalPoints = (history?.length || 0) + 1 + (projectionData?.length || 0); // Past + Present + Future
        const currentIndex = history?.length || 0;

        if (timeTravelIndex === currentIndex) {
            return {
                type: 'PRESENT',
                value: stats?.totalCurrent || 0
            };
        } else if (timeTravelIndex < currentIndex) {
            const h = history[timeTravelIndex];
            return {
                date: h?.date || 'Past',
                value: h?.value || 0,
                type: 'PAST'
            };
        } else {
            const pIndex = timeTravelIndex - currentIndex - 1;
            const p = projectionData[pIndex];
            return {
                date: p?.year ? `Year ${p.year}` : 'Future',
                value: p?.amount || 0,
                type: 'FUTURE'
            };
        }
    }, [timeTravelIndex, history, projectionData, stats.totalCurrent]);

    const isPresent = timeTravelIndex === (history?.length || 0);

    // --- DRAGGABLE GRID STATE ---
    // --- DRAGGABLE GRID STATE ---
    const DEFAULT_WIDGETS = [
        // Row 1: The "What's Happening" row
        'market-widget', 'community-widget', 'spending-widget',

        // Row 2: Visual & Planning - Gold Tier Features
        // 'oracle-hub', // Moved to Goal GPS
        'calendar',
        'wealth-simulator',

        // Row 3: Metrics & Tax Optimization
        'tax-harvesting', 'total-pl', 'top-performer', 'loan-widget',

        // Row 4: Deep Dives
        'project-5l', 'exposure-chart', 'platform-chart',
        'heatmap', 'alerts-widget',

        // Row 5: Security - Gold Tier Fortress
        'fortress-hub',

        // Row 6: Phase 8 New Widgets
        'ai-copilot', 'fire-dashboard', 'correlation-matrix', 'rebalancing-wizard',

        // Financial Skeptic
        'runway-gauge', 'liability-watchdog',

        // Goal Tracking
        'goal-thermometer',

        // Refactor: Smart Actions Standalone
        'smart-actions-widget'
    ];

    const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard-widget-order-v8'); // Bump to v8 - Refactoring layout
            return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
        } catch {
            return DEFAULT_WIDGETS;
        }
    });

    // Ensure all widgets are present if recovering from old state
    useEffect(() => {
        if (widgetOrder.length < DEFAULT_WIDGETS.length) {
            // Force reset if missing items (easier than merging for now since we changed layout logic)
            setWidgetOrder(DEFAULT_WIDGETS);
        }
    }, [DEFAULT_WIDGETS.length]); // Added dependency

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drag on click
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard-widget-order-v8', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    // Registry for Widgets
    const renderWidget = (id: string) => {
        switch (id) {
            case 'total-pl':
                return <TotalPLWidget key={id} id={id} dragHandle={isEditMode} stats={stats} isPrivacyMode={isPrivacyMode} formatCurrency={formatCurrency} formatCurrencyPrecise={formatCurrencyPrecise} />;
            case 'top-performer':
                return <TopPerformerWidget key={id} id={id} dragHandle={isEditMode} stats={stats} calculatePercentage={calculatePercentage} />;
            case 'loan-widget':
                return <LoanWidgetWrapper key={id} id={id} dragHandle={isEditMode} />;
            case 'project-5l':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <Project5LWidgetEnhanced
                            currentWealth={stats?.totalCurrent || 0}
                            targetWealth={targetNetWorth}
                            monthlyContribution={25000}
                            expectedReturn={12}
                        />
                    </SortableWidget>
                );
            case 'exposure-chart':
                return <ExposureChartWidget key={id} id={id} dragHandle={isEditMode} allocationData={allocationData} investments={investments} CustomTooltip={CustomTooltip} isPrivacyMode={isPrivacyMode} formatCurrency={formatCurrency} calculatePercentage={calculatePercentage} />;
            case 'platform-chart':
                return <PlatformChartWidget key={id} id={id} dragHandle={isEditMode} platformData={platformData} isDarkMode={isDarkMode} isPrivacyMode={isPrivacyMode} CustomTooltip={CustomTooltip} />;
            case 'tax-harvesting':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 md:row-span-2 h-full">
                        <div className="h-full min-h-[300px]">
                            <TaxHarvestingWidget investments={investments} />
                        </div>
                    </SortableWidget>
                );
            case 'fortress-hub':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-6 h-full">
                        <FortressHub />
                    </SortableWidget>
                );
            // Complex/Custom Widgets kept inline or wrapped here
            // Independent Widgets (Replacing Power Grid)
            case 'spending-widget':
                return <SpendingWidget key={id} id={id} dragHandle={isEditMode} onClick={() => onViewChange('SPENDING')} />;
            case 'market-widget':
                return <MarketWidget key={id} id={id} dragHandle={isEditMode} onClick={() => onViewChange('MARKETS')} />;
            case 'community-widget':
                return <CommunityWidget key={id} id={id} dragHandle={isEditMode} onClick={() => onViewChange('COMMUNITY')} />;
            case 'calendar':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <div className="h-full min-h-[400px]">
                            <FinancialCalendar investments={investments} />
                        </div>
                    </SortableWidget>
                );
            case 'wealth-simulator':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <div className="h-full">
                            <WealthSimulator projectionData={projectionData} isDarkMode={isDarkMode} formatCurrency={formatCurrency} />
                        </div>
                    </SortableWidget>
                );
            case 'oracle-hub':
                return null; // Removed from dashboard
            case 'smart-actions-widget':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <SmartActionsWidget onQuickAction={(action) => console.log('Action:', action)} />
                    </SortableWidget>
                );
            case 'heatmap':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <div className="h-full min-h-[400px]">
                            <HeatmapWidget history={history} isDarkMode={isDarkMode} />
                        </div>
                    </SortableWidget>
                );
            case 'alerts-widget':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <AlertsManager investments={investments} formatCurrency={formatCurrency} />
                    </SortableWidget>
                );
            case 'ai-copilot':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 h-full">
                        <AICopilotWidget formatCurrency={formatCurrency} />
                    </SortableWidget>
                );
            case 'fire-dashboard':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 h-full">
                        <FIREDashboardWidget stats={stats} formatCurrency={formatCurrency} />
                    </SortableWidget>
                );
            case 'correlation-matrix':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 h-full">
                        <CorrelationMatrixWidget investments={investments} />
                    </SortableWidget>
                );
            case 'rebalancing-wizard':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 h-full">
                        <RebalancingWizard investments={investments} formatCurrency={formatCurrency} />
                    </SortableWidget>
                );
            case 'runway-gauge':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <RunwayGauge />
                    </SortableWidget>
                );
            case 'liability-watchdog':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-3 h-full">
                        <LiabilityWatchdogWidget />
                    </SortableWidget>
                );
            case 'goal-thermometer':
                return (
                    <SortableWidget key={id} id={id} dragHandle={isEditMode} className="md:col-span-2 h-full">
                        <GoalThermometer currentNetWorth={stats?.totalCurrent} />
                    </SortableWidget>
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

            <CommandCenter marketStatus={marketStatus} marketVix={marketVix} />

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

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={widgetOrder}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
                                        {(widgetOrder || []).map(id => renderWidget(id))}
                                    </div>
                                </SortableContext>
                            </DndContext>
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

        </div >
    );
};

export default DashboardTab;