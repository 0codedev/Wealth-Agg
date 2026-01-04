import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2, Inbox, TrendingUp, FileQuestion, PlusCircle, RefreshCw,
    AlertCircle, Wallet, BarChart3, Calendar, Settings
} from 'lucide-react';

// ==================== LOADING STATE ====================

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'spinner' | 'skeleton' | 'pulse';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'md',
    variant = 'spinner'
}) => {
    const sizeClasses = {
        sm: 'h-24',
        md: 'h-48',
        lg: 'h-64'
    };

    const iconSizes = {
        sm: 24,
        md: 36,
        lg: 48
    };

    if (variant === 'skeleton') {
        return (
            <div className={`${sizeClasses[size]} w-full animate-pulse`}>
                <div className="h-full bg-slate-800/50 rounded-2xl flex flex-col p-6 gap-4">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-700/50 rounded w-2/3"></div>
                    <div className="flex-1 bg-slate-700/30 rounded-xl"></div>
                    <div className="flex gap-2">
                        <div className="h-3 bg-slate-700/50 rounded flex-1"></div>
                        <div className="h-3 bg-slate-700/50 rounded flex-1"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'pulse') {
        return (
            <div className={`${sizeClasses[size]} w-full flex items-center justify-center`}>
                <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} w-full flex flex-col items-center justify-center gap-4`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 size={iconSizes[size]} className="text-indigo-500" />
            </motion.div>
            <p className="text-slate-400 text-sm animate-pulse">{message}</p>
        </div>
    );
};

// ==================== EMPTY STATE ====================

type EmptyStateType =
    | 'no-data'
    | 'no-investments'
    | 'no-results'
    | 'no-trades'
    | 'no-alerts'
    | 'error'
    | 'setup-required';

interface EmptyStateProps {
    type?: EmptyStateType;
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, { icon: React.ReactNode; title: string; message: string }> = {
    'no-data': {
        icon: <Inbox size={48} />,
        title: 'No Data Yet',
        message: 'Start by adding some data to see insights here.'
    },
    'no-investments': {
        icon: <Wallet size={48} />,
        title: 'No Investments',
        message: 'Add your first investment to start tracking your portfolio.'
    },
    'no-results': {
        icon: <FileQuestion size={48} />,
        title: 'No Results Found',
        message: 'Try adjusting your search or filters.'
    },
    'no-trades': {
        icon: <BarChart3 size={48} />,
        title: 'No Trades Recorded',
        message: 'Log your first trade to start building your trading journal.'
    },
    'no-alerts': {
        icon: <Calendar size={48} />,
        title: 'No Alerts Set',
        message: 'Create price alerts to stay informed about your investments.'
    },
    'error': {
        icon: <AlertCircle size={48} />,
        title: 'Something Went Wrong',
        message: 'We encountered an error. Please try again.'
    },
    'setup-required': {
        icon: <Settings size={48} />,
        title: 'Setup Required',
        message: 'Complete the setup to unlock this feature.'
    }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'no-data',
    title,
    message,
    actionLabel,
    onAction,
    icon
}) => {
    const config = EMPTY_STATE_CONFIG[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 text-slate-600">
                {icon || config.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
                {title || config.title}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">
                {message || config.message}
            </p>
            {actionLabel && onAction && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                >
                    <PlusCircle size={18} />
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
};

// ==================== ERROR BOUNDARY FALLBACK ====================

interface ErrorFallbackProps {
    error?: Error;
    resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-rose-500/5 rounded-2xl border border-rose-500/20">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-slate-400 text-sm max-w-md mb-2">
                {error?.message || 'An unexpected error occurred.'}
            </p>
            {resetErrorBoundary && (
                <button
                    onClick={resetErrorBoundary}
                    className="flex items-center gap-2 px-4 py-2 mt-4 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>
            )}
        </div>
    );
};

// ==================== SECTION LOADER ====================

interface SectionLoaderProps {
    rows?: number;
}

export const SectionLoader: React.FC<SectionLoaderProps> = ({ rows = 3 }) => {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-800/50 rounded w-2/3"></div>
                    </div>
                    <div className="w-24 h-8 bg-slate-800 rounded-lg"></div>
                </div>
            ))}
        </div>
    );
};

// ==================== METRICS SKELETON ====================

export const MetricsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="h-3 bg-slate-700 rounded w-1/2 mb-3"></div>
                    <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-slate-700/30 rounded w-1/3"></div>
                </div>
            ))}
        </div>
    );
};

// ==================== CHART SKELETON ====================

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => {
    return (
        <div className={`${height} w-full bg-slate-800/30 rounded-xl p-4 animate-pulse`}>
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="flex items-end gap-2 h-[calc(100%-2rem)]">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-slate-700/50 rounded-t"
                        style={{ height: `${30 + Math.random() * 60}%` }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default {
    LoadingState,
    EmptyState,
    ErrorFallback,
    SectionLoader,
    MetricsSkeleton,
    ChartSkeleton
};
