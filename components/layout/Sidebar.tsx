import React, { useEffect, useState } from 'react';
import { TrendingUp, LayoutDashboard, Wallet, Globe, Bot, Settings, X, Target, Zap, Brain, Users, User, Baby, Building2, Lightbulb, Layers } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';

interface SidebarProps {
    activeCategory: string;
    setActiveCategory: (id: string) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    onOpenSettings: () => void;
    totalNetWorth: string;
    isPrivacyMode: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const CATEGORIES = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio Hub' },
    { id: 'market', icon: Globe, label: 'Market Intel' },
    { id: 'ipo', icon: Zap, label: 'IPO' },
    { id: 'journal', icon: Brain, label: 'Trading Journal' },
    { id: 'growth', icon: Bot, label: 'Growth Engine' },
    { id: 'planning', icon: Target, label: 'Life Planner' },
    { id: 'innovation', icon: Lightbulb, label: 'Moonshot Lab' },
    { id: 'analytics', icon: Layers, label: 'Analytics' }
];

const Sidebar: React.FC<SidebarProps> = ({
    activeCategory,
    setActiveCategory,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    onOpenSettings,
    totalNetWorth,
    isPrivacyMode,
    isCollapsed,
    onToggleCollapse
}) => {
    // const { activeEntity, setActiveEntity, getEntityName } = useFamily(); // Access from ProfileMenu now
    // const [isFamilyMenuOpen, setIsFamilyMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeCategory, setIsMobileMenuOpen]);

    const SidebarContent = () => (
        <>
            <div
                className={`p-6 flex items-center justify-between ${isCollapsed ? 'justify-center cursor-pointer' : 'cursor-pointer'}`}
                onClick={onToggleCollapse}
                title="Toggle Sidebar"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-105">
                        <TrendingUp className="text-white" size={20} />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-left-2 duration-300">
                            WealthAgg
                        </h1>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}
                    className="md:hidden p-2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Entity Switcher Removed */}

            <nav className="flex-1 px-4 space-y-2 mt-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeCategory === cat.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <cat.icon size={20} />
                        {!isCollapsed && <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{cat.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <button
                    onClick={onOpenSettings}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all font-medium ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Settings size={20} />
                    {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Settings & Data</span>}
                </button>

                {!isCollapsed && (
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Gross Worth</p>
                        <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {isPrivacyMode ? '••••••' : totalNetWorth}
                        </p>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar (Static) */}
            <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'lg:w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-all duration-300 z-40 ease-in-out`}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>

                {/* Drawer */}
                <aside
                    className={`absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <SidebarContent />
                </aside>
            </div>
        </>
    );
};

export default Sidebar;
