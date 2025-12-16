import React, { createContext, useContext, KeyboardEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Context ---
interface TabsContextType {
    activeTab: string;
    setActiveTab: (id: string) => void;
    layoutId: string;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
    const context = useContext(TabsContext);
    if (!context) throw new Error("Tabs components must be used within Tabs.Root");
    return context;
}

// --- Components ---

interface TabsRootProps {
    value: string;
    onValueChange: (val: string) => void;
    children: React.ReactNode;
    className?: string;
    layoutId?: string;
}

const Root: React.FC<TabsRootProps> = ({ value, onValueChange, children, className, layoutId = "activeTabIndicator" }) => {
    return (
        <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange, layoutId }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
}

const List: React.FC<TabsListProps> = ({ children, className = "", fullWidth = false }) => {
    const { activeTab, setActiveTab } = useTabs();
    const listRef = useRef<HTMLDivElement>(null);

    // Keyboard Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        // Focus management logic could be enhanced here to find actual Tab triggers
        // For now, we rely on the parent logic or individual tab focus
    };

    return (
        <div
            role="tablist"
            className={`flex items-center gap-1 p-1 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 relative ${fullWidth ? 'w-full' : 'w-max'} ${className}`}
        >
            {children}
        </div>
    );
};

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    onContextMenu?: (e: React.MouseEvent) => void;
}

const Trigger: React.FC<TabsTriggerProps> = ({ value, children, icon, className = "", onContextMenu }) => {
    const { activeTab, setActiveTab, layoutId } = useTabs();
    const isActive = activeTab === value;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(value)}
            onContextMenu={onContextMenu}
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 flex-1 ${isActive
                ? 'text-indigo-600 dark:text-cyan-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                } ${className}`}
        >
            {isActive && (
                <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:ring-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                {icon}
                {children}
            </span>
        </button>
    );
};

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

const Content: React.FC<TabsContentProps> = ({ value, children, className }) => {
    const { activeTab } = useTabs();

    // We handle the AnimatePresence at the usage level or here? 
    // Usually AnimatePresence needs direct children to keys.
    // To support smooth transitions, we might assume this component is used INSIDE AnimatePresence
    // OR we render nothing if not active.

    if (activeTab !== value) return null;

    return (
        <div role="tabpanel" className={className}>
            {children}
        </div>
    );
};


export const Tabs = {
    Root,
    List,
    Trigger,
    Content
};
