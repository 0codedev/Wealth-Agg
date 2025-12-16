import React from 'react';
import { motion } from 'framer-motion';

export interface ToggleItem {
    id: string;
    label?: string;
    icon?: React.ReactNode;
}

interface AnimatedToggleProps {
    items: ToggleItem[];
    activeId: string;
    onChange: (id: string) => void;
    layoutId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
    items,
    activeId,
    onChange,
    layoutId = "activeToggle",
    className = "",
    size = 'md'
}) => {

    // Size Mappings
    const containerPadding = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-1.5' : 'p-1.25';
    const buttonPadding = size === 'sm' ? 'py-1 px-2' : size === 'lg' ? 'py-2 px-4' : 'py-1.5 px-3';
    const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

    return (
        <div className={`relative flex items-center bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 ${containerPadding} ${className}`}>
            {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={`relative z-10 flex items-center justify-center gap-2 ${buttonPadding} rounded-lg font-bold transition-colors ${isActive
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className={`relative z-20 flex items-center gap-1.5 ${textSize}`}>
                            {item.icon && React.isValidElement(item.icon) && React.cloneElement(item.icon as any, { size: iconSize })}
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
