
import React, { useState } from 'react';
import { 
  Wallet, Coins, Gauge, Plus, LayoutList, Table as TableIcon, 
  Filter, Layers, RefreshCw, ArrowUpRight, Search 
} from 'lucide-react';
import { Investment } from '../../types';
import AssetSimulatorModal from '../AssetSimulatorModal';
import { HoldingsView } from './portfolio/HoldingsView';
import { RiskEngineView } from './portfolio/RiskEngineView';
import { PassiveIncomeView } from './portfolio/PassiveIncomeView';

interface PortfolioTabProps {
  investments: Investment[];
  stats: any;
  onAddAsset: () => void;
  onEditAsset: (inv: Investment, e: React.MouseEvent) => void;
  onDeleteAsset: (inv: Investment, e: React.MouseEvent) => void;
  onQuickUpdate?: (id: string, invData: Partial<Investment>) => void;
  onRefreshRecurring?: () => void;
  formatCurrency: (val: number) => string;
  calculatePercentage: (part: number, total: number) => string;
  isPrivacyMode: boolean;
  PrivacyValue: React.FC<{ value: string | number, isPrivacyMode: boolean, className?: string }>;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  investments, stats, onAddAsset, onEditAsset, onDeleteAsset, onQuickUpdate, onRefreshRecurring,
  formatCurrency, calculatePercentage, isPrivacyMode, PrivacyValue
}) => {
  const [activeTab, setActiveTab] = useState<'HOLDINGS' | 'KILL_SWITCH' | 'PASSIVE_INCOME'>('HOLDINGS');
  const [simulatorAsset, setSimulatorAsset] = useState<Investment | null>(null);

  // --- Hoisted State for Unified Toolbar ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');
  const [groupBy, setGroupBy] = useState<'NONE' | 'TYPE' | 'PLATFORM'>('NONE');
  const [viewMode, setViewMode] = useState<'CARD' | 'TERMINAL'>('CARD');

  const downloadCSV = () => {
      const headers = ["Name", "Type", "Platform", "Invested", "Current", "Last Updated"];
      const rows = investments.map(i => [i.name, i.type, i.platform, i.investedAmount, i.currentValue, i.lastUpdated]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "wealth_aggregator_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
        
        {/* Unified Navigation & Toolbar - Restored Rounder Style */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            
            {/* 1. Navigation Pills - Rounder */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full self-start md:self-auto shrink-0">
                <button 
                    onClick={() => setActiveTab('HOLDINGS')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'HOLDINGS' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    <Wallet size={14}/> Holdings
                </button>
                <button 
                    onClick={() => setActiveTab('KILL_SWITCH')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'KILL_SWITCH' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    <Gauge size={14}/> Kill Switch
                </button>
                <button 
                    onClick={() => setActiveTab('PASSIVE_INCOME')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'PASSIVE_INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    <Coins size={14}/> Passive
                </button>
            </div>

            {/* 2. Search Bar (Only for Holdings) - Rounder & Gray Background */}
            {activeTab === 'HOLDINGS' && (
                <div className="relative flex-1 min-w-[200px] animate-in fade-in slide-in-from-left-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500 border-none" 
                    />
                </div>
            )}

            {/* 3. Controls (Only for Holdings) */}
            {activeTab === 'HOLDINGS' && (
                <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2">
                    {/* Add Button - Glowing & Round */}
                    <button 
                        onClick={onAddAsset} 
                        className="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] flex items-center justify-center transition-all active:scale-95 group"
                    >
                        <Plus size={22} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

                    {/* View Toggles - Rounder */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                        <button 
                            onClick={() => setViewMode('CARD')} 
                            className={`p-2.5 rounded-full transition-all ${viewMode === 'CARD' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <LayoutList size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('TERMINAL')} 
                            className={`p-2.5 rounded-full transition-all ${viewMode === 'TERMINAL' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <TableIcon size={16} />
                        </button>
                    </div>

                    {/* Filter Dropdown - Rounder & Gray Background */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Filter size={14} className="text-slate-500"/>
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value as any)} 
                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer min-w-[60px]"
                        >
                            <option value="ALL">All P&L</option>
                            <option value="PROFIT">Profit</option>
                            <option value="LOSS">Loss</option>
                        </select>
                    </div>

                    {/* Grouping Dropdown - Rounder & Gray Background */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Layers size={14} className="text-slate-500"/>
                        <select 
                            value={groupBy} 
                            onChange={(e) => setGroupBy(e.target.value as any)} 
                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer min-w-[80px]"
                        >
                            <option value="NONE">No Grouping</option>
                            <option value="TYPE">By Type</option>
                            <option value="PLATFORM">By App</option>
                        </select>
                    </div>

                    {/* Extra Actions - Rounder & Gray Background */}
                    <button 
                        onClick={() => onRefreshRecurring && onRefreshRecurring()} 
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Refresh SIPs"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button 
                        onClick={downloadCSV} 
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Export CSV"
                    >
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            )}
        </div>

        {/* Content Render */}
        {activeTab === 'HOLDINGS' && (
            <HoldingsView 
                investments={investments}
                totalAssets={stats.totalAssets}
                onAddAsset={onAddAsset}
                onEditAsset={onEditAsset}
                onDeleteAsset={onDeleteAsset}
                onQuickUpdate={onQuickUpdate}
                formatCurrency={formatCurrency}
                calculatePercentage={calculatePercentage}
                isPrivacyMode={isPrivacyMode}
                PrivacyValue={PrivacyValue}
                setSimulatorAsset={setSimulatorAsset}
                // Passed Props
                searchTerm={searchTerm}
                filterType={filterType}
                groupBy={groupBy}
                viewMode={viewMode}
            />
        )}

        {activeTab === 'KILL_SWITCH' && (
            <RiskEngineView 
                investments={investments}
                totalAssets={stats.totalAssets}
                formatCurrency={formatCurrency}
                setSimulatorAsset={setSimulatorAsset}
            />
        )}

        {activeTab === 'PASSIVE_INCOME' && (
            <PassiveIncomeView 
                investments={investments}
                totalAssets={stats.totalAssets}
                formatCurrency={formatCurrency}
            />
        )}

        {/* Simulator Modal (Shared across tabs) */}
        {simulatorAsset && (
            <AssetSimulatorModal 
                investment={simulatorAsset} 
                onClose={() => setSimulatorAsset(null)} 
            />
        )}
    </div>
  );
};

export default PortfolioTab;
