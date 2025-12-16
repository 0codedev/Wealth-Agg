import React from 'react';
import { LucideIcon, Plus, Upload, Search, FileText } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    variant?: 'default' | 'minimal' | 'card';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = FileText,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    variant = 'default'
}) => {
    if (variant === 'minimal') {
        return (
            <div className="text-center py-8">
                <Icon size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                {description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
                )}
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={14} /> {actionLabel}
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Icon size={28} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                        {description}
                    </p>
                )}
                <div className="flex items-center justify-center gap-3">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Upload size={18} /> {secondaryActionLabel}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                <Icon size={36} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
                    {description}
                </p>
            )}
            <div className="flex items-center gap-3">
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25 inline-flex items-center gap-2"
                    >
                        <Plus size={18} /> {actionLabel}
                    </button>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                    <button
                        onClick={onSecondaryAction}
                        className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                    >
                        {secondaryActionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
