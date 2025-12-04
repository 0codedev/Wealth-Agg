import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, PieChart, Wallet, Plus, 
  ArrowRight, Bot, BookOpen, Eye, EyeOff, 
  Moon, Sun, ShieldCheck, GraduationCap, Flame, HardDrive, Upload, Download, Loader2, Lock, Settings
} from 'lucide-react';
import { Investment, CHART_COLORS, ASSET_CLASS_COLORS } from './types';

// Components
import AddInvestmentModal from './components/AddInvestmentModal';
import AddTradeModal from './components/AddTradeModal';
import PsychDashboard from './components/PsychDashboard';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import MarketTicker from './components/MarketTicker';
import DataBackupSettings from './components/DataBackupSettings';
import LogicConfigModal from './components/LogicConfigModal'; // New Import

// Tabs
import DashboardTab from './components/tabs/DashboardTab';
import PortfolioTab from './components/tabs/PortfolioTab';
import AdvisorTab from './components/tabs/AdvisorTab';
import IPOWarRoom from './components/tabs/IPOWarRoom';
import ComplianceShield from './components/tabs/ComplianceShield';
import Academy from './components/tabs/Academy';

// Hooks & Services
import { usePortfolio } from './hooks/usePortfolio';
import { useMarketSentiment } from './hooks/useMarketSentiment';
import { calculateStreaks } from './utils/helpers';
import { db } from './database';

// --- Helper Functions ---
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyPrecise = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

const calculatePercentage = (part: number, total: number) => {
  if (total === 0) return "0.0";
  return ((part / total) * 100).toFixed(1);
};

// --- Shared Components ---
const PrivacyValue = ({ value, isPrivacyMode, className = "" }: { value: string | number, isPrivacyMode: boolean, className?: string }) => {
  if (isPrivacyMode) {
    return <span className={`tracking-widest opacity-50 ${className}`}>••••••</span>;
  }
  return <span className={className}>{typeof value === 'number' ? formatCurrency(value) : value}</span>;
};

const CustomTooltip = ({ active, payload, label, isPrivacyMode }: any) => {
  if (active && payload && payload.length) {
    const formattedLabel = label && !isNaN(Date.parse(label)) && typeof label === 'string' && label.includes('-') 
        ? formatDate(label) 
        : label;
    
    return (
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 z-50 min-w-[180px]">
        {formattedLabel && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                {formattedLabel}
            </p>
        )}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></span>
                 {entry.name || "Value"}
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-mono text-right">
                 {isPrivacyMode ? '••••••' : formatCurrencyPrecise(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const App: React.FC = () => {
  // --- View State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'advisor' | 'journal' | 'ipo' | 'compliance' | 'academy'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  
  // --- Theme & Privacy ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('theme') === 'dark' || 
                 (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      return false;
  });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // --- Core Business Logic (Custom Hooks) ---
  const { 
    investments, stats, allocationData, assetClassData, platformData, projectionData,
    addInvestment, updateInvestment, deleteInvestment, refreshRecurringInvestments, refreshData
  } = usePortfolio();

  const { vix, status: marketStatus } = useMarketSentiment();

  // --- Slump Logic ---
  const [isSlumpActive, setIsSlumpActive] = useState(false);

  useEffect(() => {
      const checkSlump = async () => {
          const trades = await db.trades.toArray();
          const { currentLoseStreak } = calculateStreaks(trades);
          setIsSlumpActive(currentLoseStreak >= 3);
      };
      checkSlump();
  }, [investments]); // Re-check when portfolio changes (often means trade update too)

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Handlers ---
  const handleSaveInvestment = (invData: Omit<Investment, 'id'>, id?: string) => {
    if (id) {
        updateInvestment(id, invData);
    } else {
        addInvestment(invData);
    }
    setEditingInvestment(null);
  };

  const handleTradeSave = () => {
    refreshData(); // Triggers the PnL Sync to Portfolio
    setIsTradeModalOpen(false);
  };

  const openDeleteModal = (inv: Investment, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvestmentToDelete(inv);
  };

  const handleEditClick = (inv: Investment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingInvestment(inv);
    setIsModalOpen(true);
  };

  const executeDelete = () => {
    if (investmentToDelete) {
        deleteInvestment(investmentToDelete.id);
        setInvestmentToDelete(null);
    }
  };

  const TABS = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
      { id: 'advisor', icon: Bot, label: 'AI Advisor' },
      { id: 'academy', icon: GraduationCap, label: 'Academy' },
      { id: 'journal', icon: BookOpen, label: 'Psych Journal' },
      { id: 'ipo', icon: Flame, label: 'IPO War Room' },
      { id: 'compliance', icon: ShieldCheck, label: 'Compliance' },
  ] as const;

  const isCrashProtocol = marketStatus === 'RED';

  const getPageTitle = (tab: typeof activeTab) => {
      switch(tab) {
          case 'advisor': return 'AI Financial Advisor';
          case 'journal': return 'Psychology Journal';
          case 'academy': return 'The Learning Engine';
          case 'ipo': return 'IPO War Room';
          case 'compliance': return 'Compliance Shield';
          case 'dashboard': return 'Dashboard Overview';
          case 'portfolio': return 'Portfolio Overview';
          default: return 'Overview';
      }
  };

  const getPageSubtitle = (tab: typeof activeTab) => {
      switch(tab) {
          case 'advisor': return 'Professional intelligence for your personal wealth.';
          case 'journal': return 'Track your emotions to master the markets.';
          case 'academy': return '20-Day Interactive Sprint to Trading Mastery.';
          case 'ipo': return 'DRHP Forensic Analyzer & GMP Validator.';
          case 'compliance': return 'Tax Harvesting & Regulatory Rule Engine.';
          default: return 'Track and manage your wealth across all platforms.';
      }
  };

  // Logic: Block adding new trades if Slump is active, UNLESS user is in Journal tab (where they resolve it)
  const isTradeBlocked = isSlumpActive && activeTab !== 'journal';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-black text-white h-screen sticky top-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-2 text-indigo-400 mb-8">
            <div className="p-2 bg-indigo-500/20 rounded-lg"><PieChart size={24} /></div>
            <span className="text-xl font-bold text-white tracking-tight">WealthAgg</span>
          </div>
          <nav className="space-y-2">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <tab.icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && <ArrowRight size={16} className="ml-auto opacity-50" />}
                </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800 space-y-4">
            
            {/* The Black Box Controls (Backup) */}
            <DataBackupSettings onDataRestored={refreshData} />

            {/* Theme & Privacy Controls & Config */}
            <div className="flex items-center justify-between">
                 <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-2 text-slate-400 hover:text-white transition-colors" title={isPrivacyMode ? "Show Values" : "Hide Values"}>
                    {isPrivacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                 </button>
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-white transition-colors" title={isDarkMode ? "Light Mode" : "Dark Mode"}>
                    {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
                 </button>
                 <button onClick={() => setIsConfigOpen(true)} className="p-2 text-rose-500 hover:text-rose-400 transition-colors hover:animate-pulse" title="Logic Configuration">
                    <Settings size={18}/>
                 </button>
            </div>

            <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Total Net Worth</p>
                <p className="text-lg font-bold text-emerald-400">
                    <PrivacyValue value={stats.totalCurrent} isPrivacyMode={isPrivacyMode} />
                </p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <MarketTicker />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-slate-50 dark:bg-slate-950">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white"><PieChart size={20} /></div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">WealthAgg</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                         <button onClick={() => setIsConfigOpen(true)} className="text-rose-500">
                             <Settings size={20}/>
                        </button>
                        <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="text-slate-500 dark:text-slate-400">
                             {isPrivacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                         <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-500 dark:text-slate-400">
                             {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Worth</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            <PrivacyValue value={stats.totalCurrent} isPrivacyMode={isPrivacyMode} />
                        </p>
                    </div>
                </div>
            </div>

            <header className="mb-8 hidden md:block">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                {getPageTitle(activeTab)}
                
                {activeTab === 'journal' && (
                    <button 
                        onClick={() => setIsTradeModalOpen(true)}
                        className="ml-4 px-4 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    >
                        + Log Trade
                    </button>
                )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
                {getPageSubtitle(activeTab)}
            </p>
            </header>

            {activeTab === 'dashboard' && (
                <DashboardTab 
                    investments={investments}
                    stats={stats}
                    allocationData={allocationData}
                    assetClassData={assetClassData}
                    platformData={platformData}
                    projectionData={projectionData}
                    isPrivacyMode={isPrivacyMode}
                    isDarkMode={isDarkMode}
                    onAddFirstAsset={() => { setEditingInvestment(null); setIsModalOpen(true); }}
                    formatCurrency={formatCurrency}
                    formatCurrencyPrecise={formatCurrencyPrecise}
                    calculatePercentage={calculatePercentage}
                    ASSET_CLASS_COLORS={ASSET_CLASS_COLORS}
                    CustomTooltip={(props: any) => <CustomTooltip {...props} isPrivacyMode={isPrivacyMode} />}
                    marketVix={vix}
                    marketStatus={marketStatus}
                />
            )}
            
            {activeTab === 'portfolio' && (
                <PortfolioTab 
                    investments={investments}
                    stats={stats}
                    onAddAsset={() => { setEditingInvestment(null); setIsModalOpen(true); }}
                    onEditAsset={handleEditClick}
                    onDeleteAsset={openDeleteModal}
                    onQuickUpdate={updateInvestment}
                    onRefreshRecurring={refreshRecurringInvestments}
                    formatCurrency={formatCurrency}
                    calculatePercentage={calculatePercentage}
                    isPrivacyMode={isPrivacyMode}
                    PrivacyValue={PrivacyValue}
                />
            )}
            
            {activeTab === 'advisor' && (
                <AdvisorTab 
                    investments={investments}
                    totalNetWorth={formatCurrency(stats.totalCurrent)}
                    onNavigate={(tab) => setActiveTab(tab as any)}
                />
            )}
            
            {activeTab === 'journal' && <PsychDashboard />}
            
            {activeTab === 'ipo' && (
                <IPOWarRoom 
                    investments={investments} 
                    onRefresh={refreshData} // Pass the refresh trigger
                />
            )}
            
            {activeTab === 'compliance' && <ComplianceShield investments={investments} />}

            {activeTab === 'academy' && <Academy />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-x-auto">
         {TABS.map(tab => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
             >
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label.split(' ')[0]}</span>
             </button>
         ))}
      </nav>

      {/* Mobile Add Button - Floating */}
      <button 
        onClick={() => {
            if (isTradeBlocked) {
                // If blocked, force navigation to journal to resolve it
                setActiveTab('journal');
                return;
            }
            if (activeTab === 'journal') {
                setIsTradeModalOpen(true);
            } else {
                setEditingInvestment(null); 
                setIsModalOpen(true);
            }
        }}
        className={`md:hidden fixed bottom-20 right-4 p-4 rounded-full shadow-lg active:scale-95 transition-transform z-50 ${
            isTradeBlocked
            ? 'bg-rose-600 animate-pulse' 
            : activeTab === 'journal' 
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/40' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40'
        }`}
      >
           {isTradeBlocked ? <Lock size={24} className="text-white"/> : <Plus size={24} className="text-white" />}
      </button>

      <AddInvestmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveInvestment}
        editingInvestment={editingInvestment}
      />
      
      <AddTradeModal 
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSave={handleTradeSave}
      />

      <DeleteConfirmationModal
        isOpen={!!investmentToDelete}
        onClose={() => setInvestmentToDelete(null)}
        onConfirm={executeDelete}
        itemName={investmentToDelete?.name || 'Asset'}
      />

      {/* Logic Config Modal */}
      <LogicConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};

export default App;