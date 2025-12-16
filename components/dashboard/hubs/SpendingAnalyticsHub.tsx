import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, List, PieChart, Plus } from 'lucide-react';
import { SpendingOverview } from '../spending/SpendingOverview';
import { TransactionTimeline } from '../spending/TransactionTimeline';
import { JupiterAnalyticsWidget } from '../spending/JupiterAnalyticsWidget';
import { BankImportModal } from '../spending/BankImportModal';
import { MonthlySpendTrendWidget } from '../spending/MonthlySpendTrendWidget';
import { SpendingCalendarWidget } from '../spending/SpendingCalendarWidget';
import { CategoryDonutChart } from '../spending/CategoryDonutChart';
import { TopMerchantsBarChart } from '../spending/TopMerchantsBarChart';
import { NetWorthTrendWidget } from '../spending/NetWorthTrendWidget';

interface SpendingAnalyticsHubProps {
    onBack?: () => void;
    formatCurrency: (val: number) => string;
}

type Tab = 'overview' | 'timeline' | 'analytics';

export const SpendingAnalyticsHub: React.FC<SpendingAnalyticsHubProps> = ({ onBack, formatCurrency }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const topRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // scrollIntoView works better for nested scrolling containers
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <div ref={topRef} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Spending & Analytics</h2>
                        <p className="text-sm text-slate-500">Track, Analyze, and Optimize your expenses</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                        title="Import Bank Statement"
                    >
                        <Plus size={20} />
                    </button>

                    <BankImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                    />

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <LayoutGrid size={16} /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'timeline'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <List size={16} /> Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <PieChart size={16} /> Analytics
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'overview' && <SpendingOverview formatCurrency={formatCurrency} />}
                {activeTab === 'timeline' && <TransactionTimeline formatCurrency={formatCurrency} />}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <JupiterAnalyticsWidget formatCurrency={formatCurrency} />
                        <NetWorthTrendWidget formatCurrency={formatCurrency} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CategoryDonutChart formatCurrency={formatCurrency} />
                            <TopMerchantsBarChart formatCurrency={formatCurrency} />
                            <MonthlySpendTrendWidget formatCurrency={formatCurrency} />
                            <SpendingCalendarWidget formatCurrency={formatCurrency} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
