import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

// --- Types ---
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
    label: string;
    onClick: () => void;
}

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: ToastAction;
}

interface ToastContextValue {
    toasts: Toast[];
    toast: {
        success: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
        error: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
        warning: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
        info: (message: string, options?: { duration?: number; action?: ToastAction }) => void;
    };
    removeToast: (id: string) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// --- Hook ---
export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// --- Toast Component ---
const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    const iconProps = { size: 20 };
    switch (type) {
        case 'success': return <CheckCircle {...iconProps} className="text-emerald-500" />;
        case 'error': return <XCircle {...iconProps} className="text-red-500" />;
        case 'warning': return <AlertTriangle {...iconProps} className="text-amber-500" />;
        case 'info': return <Info {...iconProps} className="text-blue-500" />;
    }
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const bgColors: Record<ToastType, string> = {
        success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
                min-w-[280px] max-w-[400px]
                ${bgColors[toast.type]}
            `}
        >
            <ToastIcon type={toast.type} />
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label="Close notification"
            >
                <X size={16} className="text-slate-400" />
            </button>
            {toast.action && (
                <button
                    onClick={() => {
                        toast.action?.onClick();
                        onClose();
                    }}
                    className="ml-2 px-3 py-1 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                    {toast.action.label}
                </button>
            )}
        </motion.div>
    );
};

// --- Provider ---
interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType, options?: { duration?: number; action?: ToastAction }) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = options?.duration ?? 4000;
        const newToast: Toast = { id, message, type, duration, action: options?.action };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const toast = {
        success: (message: string, options?: { duration?: number; action?: ToastAction }) => addToast(message, 'success', options),
        error: (message: string, options?: { duration?: number; action?: ToastAction }) => addToast(message, 'error', options),
        warning: (message: string, options?: { duration?: number; action?: ToastAction }) => addToast(message, 'warning', options),
        info: (message: string, options?: { duration?: number; action?: ToastAction }) => addToast(message, 'info', options),
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, removeToast }}>
            {children}

            {/* Toast Container - Bottom Right */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem
                                toast={t}
                                onClose={() => removeToast(t.id)}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
