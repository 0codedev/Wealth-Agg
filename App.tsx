import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
    LayoutDashboard, Wallet, Globe, Bot,
    Menu, Search, Bell,
    Compass, TrendingUp, ShieldCheck, Clipboard,
    Activity, Zap, BookOpen, Brain, Eye, EyeOff, Moon, Sun, Target, Heart
} from 'lucide-react';

// Layout
import Sidebar from './components/layout/Sidebar';

// Critical Path - Load eagerly
import DashboardTab from './components/tabs/DashboardTab';
import { PortfolioTab } from './components/tabs/PortfolioTab';
import JarvisOrb from './components/ai/JarvisOrb';

// Lazy Loaded Tabs (reduces initial bundle by ~40%)
// Lazy Loaded Tabs (reduces initial business by ~40%)
const AdvisorTab = lazy(() => import('./components/tabs/AdvisorTab'));
const PsychDashboard = lazy(() => import('./components/PsychDashboard'));
const StrategyLab = lazy(() => import('./components/tabs/StrategyLab'));
const MacroPulse = lazy(() => import('./components/tabs/MacroPulse'));
const GoalGPS = lazy(() => import('./components/tabs/GoalGPS'));
const IPOWarRoom = lazy(() => import('./components/tabs/IPOWarRoom'));
const ComplianceShield = lazy(() => import('./components/tabs/ComplianceShield'));
const Academy = lazy(() => import('./components/tabs/Academy'));
const AlphaPredator = lazy(() => import('./components/growth/AlphaPredator'));
const PaperTrading = lazy(() => import('./components/tabs/market/PaperTrading').then(m => ({ default: m.PaperTrading })));
const RetirementPlanner = lazy(() => import('./components/tabs/RetirementPlanner'));
const LegacyVault = lazy(() => import('./components/tabs/LegacyVault'));

// Modals
import AddInvestmentModal from './components/AddInvestmentModal';
import LogicConfigModal from './components/LogicConfigModal';

// Shared Components
import { PrivacyValue } from './components/shared/PrivacyComponents';
import { CustomTooltip } from './components/shared/CustomTooltip';
import { DashboardSkeleton } from './components/shared/Skeleton';
import { Tabs } from './components/ui/AnimatedTabs';

// Hooks & Store
import { usePortfolio } from './hooks/usePortfolio';
import { useHotkeys } from './hooks/useHotkeys';
import { useMarketSentiment } from './hooks/useMarketSentiment';
import { ASSET_CLASS_COLORS, Investment } from './types';

// Helpers
import { formatCurrency, formatCurrencyPrecise, calculatePercentage } from './utils/helpers';

// God-Tier Features
import { VoiceCommandButton, AlertsDropdown, SettingsPanel } from './components/shared/GodTierFeatures';
import { useSettingsStore } from './store/settingsStore';


const SUB_TABS: Record<string, { id: string, label: string, icon: any }[]> = {
    dashboard: [],
    portfolio: [
        { id: 'portfolio', label: 'Overview', icon: Wallet },
        { id: 'gps', label: 'Goal GPS', icon: Compass },
        { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    ],
    market: [
        { id: 'macro', label: 'Macro Pulse', icon: Globe },
        { id: 'strategy', label: 'Strategy Lab', icon: Activity },
        { id: 'paper', label: 'Paper Sandbox', icon: Clipboard },
    ],
    ipo: [],
    growth: [
        { id: 'predator', label: 'Predator Engine', icon: Zap },
        { id: 'advisor', label: 'AI Advisor', icon: Bot },
        { id: 'academy', label: 'Academy', icon: BookOpen },
    ],
    journal: [],
    planning: [
        { id: 'retirement', label: 'Retirement & FIRE', icon: Target },
        { id: 'legacy', label: 'Legacy Vault', icon: Heart }
    ]
};

const CATEGORY_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio Hub',
    market: 'Market Intel',
    ipo: 'IPO War Room',
    journal: 'Psych Dashboard',
    growth: 'Growth Engine',
    planning: 'Life Planner'
};

const App: React.FC = () => {
    // --- UI State ---
    const [activeCategory, setActiveCategory] = useState<string>('dashboard');
    const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');
    // Hoisted Dashboard State for Global Hotkey Access
    const [dashboardView, setDashboardView] = useState<'MAIN' | 'SPENDING' | 'MARKETS' | 'COMMUNITY'>('MAIN');

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const { isDarkMode, updateSetting } = useSettingsStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // --- Modals ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // --- Data ---
    const {
        investments, stats, allocationData, assetClassData, platformData,
        projectionData, history, lifeEvents,
        addInvestment, updateInvestment, deleteInvestment,
        addLifeEvent, deleteLifeEvent, refreshRecurringInvestments, refreshData
    } = usePortfolio();

    const { vix, status: marketStatus } = useMarketSentiment();

    // --- Effects & Hotkeys ---
    // Search (Cmd+K)
    useHotkeys('ctrl+k', (e) => {
        e.preventDefault();
        setIsSearchFocused(true);
        // Need to focus the input actually, handled by state passing? 
        // Best to use a ref for the input.
        document.getElementById('global-search-input')?.focus();
    });

    // Navigation
    useHotkeys('ctrl+d', (e) => { e.preventDefault(); setActiveCategory('dashboard'); setDashboardView('MAIN'); });
    useHotkeys('ctrl+j', (e) => { e.preventDefault(); setActiveCategory('journal'); });
    useHotkeys('ctrl+p', (e) => { e.preventDefault(); setActiveCategory('portfolio'); });
    // Global Shortcut to Markets (Ctrl+M)
    useHotkeys('ctrl+m', (e) => {
        e.preventDefault();
        setActiveCategory('dashboard');
        // If already on dashboard, we still want to ensure we switch view.
        // We might need to ensure subtab is dashboard too if we have subtabs in dashboard category?
        // Dashboard category currently has empty subtabs list, so it defaults to main dashboard.
        setDashboardView('MARKETS');
    });

    // Close Modals (Esc)
    useHotkeys('escape', () => {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isSearchFocused) setIsSearchFocused(false);
    });

    useEffect(() => {
        const subTabs = SUB_TABS[activeCategory];
        if (!subTabs || subTabs.length === 0) {
            setActiveSubTab(activeCategory);
        } else {
            setActiveSubTab(subTabs[0].id);
        }
    }, [activeCategory]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // --- Handlers ---
    const handleAddAsset = async (asset: any) => {
        await addInvestment(asset);
        setIsAddModalOpen(false);
    };

    const handleEditAsset = async (id: string, asset: any) => {
        await updateInvestment(id, asset);
        setEditingInvestment(null);
        setIsAddModalOpen(false);
    };

    // --- Render Content ---
    const renderContent = () => {
        const commonProps = {
            investments,
            stats,
            allocationData,
            assetClassData,
            platformData,
            projectionData,
            history,
            lifeEvents,
            isPrivacyMode,
            isDarkMode,
            formatCurrency,
            formatCurrencyPrecise,
            calculatePercentage,
            ASSET_CLASS_COLORS,
            CustomTooltip,
            PrivacyValue,
            marketVix: vix,
            marketStatus,
            addLifeEvent,
            deleteLifeEvent,
            onAddFirstAsset: () => setIsAddModalOpen(true),
            onAddAsset: () => { setEditingInvestment(null); setIsAddModalOpen(true); },
            onEditAsset: (inv: Investment) => { setEditingInvestment(inv); setIsAddModalOpen(true); },
            onDeleteAsset: async (inv: Investment) => await deleteInvestment(inv.id),
            onQuickUpdate: updateInvestment,
            onRefreshRecurring: refreshRecurringInvestments,
            onRefreshPortfolio: refreshData,
            totalNetWorth: formatCurrency(stats?.totalCurrent || 0),
            onNavigate: (tab: string) => setActiveCategory(tab)
        };

        switch (activeSubTab) {
            case 'dashboard': return <DashboardTab {...commonProps} view={dashboardView} onViewChange={setDashboardView} />;
            case 'portfolio': return <PortfolioTab {...commonProps} />;
            case 'gps': return <GoalGPS />;
            case 'compliance': return <ComplianceShield {...commonProps} />;
            case 'strategy': return <StrategyLab />;
            case 'macro': return <MacroPulse />;
            case 'paper': return <PaperTrading />;
            case 'ipo': return <IPOWarRoom {...commonProps} onRefresh={commonProps.onRefreshPortfolio} />;
            case 'advisor': return <AdvisorTab {...commonProps} />;
            case 'predator': return <AlphaPredator investments={investments} />;
            case 'journal': return <PsychDashboard />;
            case 'academy': return <Academy />;
            case 'retirement': return <RetirementPlanner {...commonProps} currentCorpus={stats?.totalCurrent || 0} />;
            case 'legacy': return <LegacyVault {...commonProps} />;
            default: return <DashboardTab {...commonProps} view={dashboardView} onViewChange={setDashboardView} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden selections:bg-indigo-500/30">

            {/* Sidebar Component handles Static (Desktop) and Drawer (Mobile) */}
            <Sidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onOpenSettings={() => setIsSettingsOpen(true)}
                totalNetWorth={formatCurrency(stats?.totalCurrent || 0)}
                isPrivacyMode={isPrivacyMode}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">

                {/* Content */}
                <div
                    onClick={() => setIsSearchFocused(false)}
                    className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col"
                >
                    {/* Header - Sticky on mobile, scrolls on desktop */}
                    <header className="mobile-sticky-header h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
                        <div className="flex items-center gap-4">
                            {/* Mobile Toggle Button */}
                            <button
                                className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <Menu size={24} />
                            </button>


                            {/* Sub Navigation */}
                            {/* Sub Navigation (Animated) */}
                            <div className="flex items-center max-w-[500px] overflow-x-auto scrollbar-none">
                                {SUB_TABS[activeCategory]?.length > 0 ? (
                                    <Tabs.Root value={activeSubTab} onValueChange={setActiveSubTab} layoutId="app-global-nav">
                                        <Tabs.List>
                                            {(SUB_TABS[activeCategory] || []).map(tab => (
                                                <Tabs.Trigger
                                                    key={tab.id}
                                                    value={tab.id}
                                                    icon={<tab.icon size={14} />}
                                                >
                                                    {tab.label}
                                                </Tabs.Trigger>
                                            ))}
                                        </Tabs.List>
                                    </Tabs.Root>
                                ) : (
                                    <div className="px-3 py-1.5 flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-800">
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {CATEGORY_LABELS[activeCategory] || 'Dashboard'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-64 relative hidden md:block group z-50">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Search size={16} />
                                </div>
                                <input
                                    id="global-search-input"
                                    type="text"
                                    placeholder="Search assets or features... (Ctrl+K)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    // onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Logic handled by wrapper
                                    onFocus={() => setIsSearchFocused(true)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:w-80"
                                />

                                {/* Search Results Dropdown */}
                                {(isSearchFocused && searchQuery.trim().length > 0) && (
                                    <div className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 z-[100]">
                                        {/* FILTERED ASSETS */}
                                        {(investments || []).filter(inv =>
                                            inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            inv.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            inv.type.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(inv => (
                                            <button
                                                key={inv.id}
                                                onMouseDown={() => {
                                                    setEditingInvestment(inv);
                                                    setIsAddModalOpen(true);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm opacity-80`} style={{ backgroundColor: ASSET_CLASS_COLORS[inv.type] || '#6366f1' }}>
                                                        {inv.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{inv.name}</p>
                                                        <p className="text-xs text-slate-500">{inv.ticker || inv.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(inv.currentValue || 0)}</p>
                                                </div>
                                            </button>
                                        ))}

                                        {/* FILTERED FEATURES (TABS) */}
                                        {Object.entries(SUB_TABS).flatMap(([cat, tabs]) =>
                                            tabs.map(t => ({ ...t, cat }))
                                        ).filter(t =>
                                            t.label.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(t => (
                                            <button
                                                key={t.id}
                                                onMouseDown={() => {
                                                    setActiveCategory(t.cat);
                                                    setActiveSubTab(t.id);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-lg">
                                                    <t.icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{t.label}</p>
                                                    <p className="text-xs text-slate-500 capitalize">Go to {t.cat}</p>
                                                </div>
                                            </button>
                                        ))}

                                        {/* No Results State */}
                                        {(investments || []).filter(inv => inv.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                                            Object.entries(SUB_TABS).flatMap(([_, tabs]) => tabs).filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                <div className="p-8 text-center text-slate-400">
                                                    <p className="text-sm">No assets or features found.</p>
                                                    <button
                                                        onMouseDown={() => { setIsAddModalOpen(true); setSearchQuery(''); }}
                                                        className="mt-2 text-xs text-indigo-500 font-bold hover:underline"
                                                    >
                                                        Add New Asset +
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                                className={`p-2 rounded-full transition-colors ${isPrivacyMode ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-indigo-400'}`}
                                title="Privacy Mode"
                            >
                                {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>

                            <button
                                onClick={() => {
                                    const { isEditMode, updateSetting } = useSettingsStore.getState();
                                    updateSetting('isEditMode', !isEditMode);
                                }}
                                className={`p-2 rounded-full transition-colors ${useSettingsStore((s) => s.isEditMode) ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-indigo-400'}`}
                                title="Customize Dashboard"
                            >
                                <LayoutDashboard size={20} />
                            </button>

                            <button
                                onClick={() => updateSetting('isDarkMode', !isDarkMode)}
                                className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                            </button>

                            {/* Voice Command Button */}
                            <VoiceCommandButton />

                            {/* Smart Alerts Dropdown */}
                            <AlertsDropdown investments={investments} />

                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full ring-2 ring-slate-100 dark:ring-slate-800 cursor-pointer hover:shadow-lg transition-transform hover:scale-105" title="User Profile"></div>
                        </div>
                    </header>

                    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                        <Suspense fallback={<DashboardSkeleton />}>
                            {renderContent()}
                        </Suspense>
                    </div>
                </div>
            </main>

            {/* Global Modals */}
            {isAddModalOpen && (
                <AddInvestmentModal
                    isOpen={isAddModalOpen}
                    onClose={() => { setIsAddModalOpen(false); setEditingInvestment(null); }}
                    onSave={async (data, id) => {
                        if (id) {
                            await updateInvestment(id, data);
                        } else {
                            await addInvestment(data as Investment);
                        }
                        setIsAddModalOpen(false);
                        setEditingInvestment(null);
                    }}
                    editingInvestment={editingInvestment}
                />
            )}

            <LogicConfigModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
            {/* Jarvis Voice Interface */}
            <JarvisOrb onNavigate={(tab) => {
                setActiveCategory(tab); // Assuming 'tab' here refers to a main category
                // Also ensure we scroll to top or handle specific sub-tabs if needed
            }} />
        </div>
    );
};

export default App;
