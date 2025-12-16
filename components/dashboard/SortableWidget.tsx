import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Maximize2, Minimize2, EyeOff, Trash2 } from 'lucide-react';
import { useToast } from '../shared/ToastProvider';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string; // Additional classes
    dragHandle?: boolean;
    onRemove?: () => void;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className = '', dragHandle = false, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const { toast } = useToast();
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging || isFocused ? 50 : 'auto',
        position: 'relative' as 'relative',
    };

    // Context Menu Handlers
    const handleContextMenu = (e: React.MouseEvent) => {
        if (!dragHandle) return; // Only allow context menu in Edit Mode to allow standard context menu otherwise? Or allow always? 
        // Let's allow it always for "Wow" factor, but maybe restrict sensitive actions.
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const menuItems: ContextMenuItem[] = [
        {
            label: isFocused ? "Exit Focus" : "Focus Mode",
            icon: isFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />,
            onClick: () => setIsFocused(!isFocused)
        },
        {
            label: "Hide Widget",
            icon: <EyeOff size={14} />,
            onClick: () => {
                toast.info("Widget hidden (Persisting state is TODO)");
                if (onRemove) onRemove();
            }
        },
        ...(onRemove ? [{
            label: "Remove",
            icon: <Trash2 size={14} />,
            onClick: onRemove,
            danger: true
        }] : [])
    ];

    return (
        <>
            <motion.div
                ref={setNodeRef}
                style={style}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    scale: isFocused ? 1.02 : 1,
                    boxShadow: isFocused ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                whileHover={{ scale: isDragging ? 1 : 1.01 }}
                onContextMenu={handleContextMenu}
                className={`
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
                    rounded-2xl border border-white/20 dark:border-white/10 
                    shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    overflow-hidden transition-all duration-300
                    ${isFocused ? 'fixed inset-4 md:inset-10 z-[100] !transform-none !w-auto !h-auto' : className}
                `}
            >
                {/* Drag Handle Indicator (Only in Edit Mode) */}
                {/* We use a cleaner, less intrusive handle now */}
                {dragHandle && !isFocused && (
                    <div
                        className="absolute top-3 right-3 p-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-500 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors z-50 group"
                        {...attributes}
                        {...listeners}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity">
                            <circle cx="9" cy="12" r="1" />
                            <circle cx="9" cy="5" r="1" />
                            <circle cx="9" cy="19" r="1" />
                            <circle cx="15" cy="12" r="1" />
                            <circle cx="15" cy="5" r="1" />
                            <circle cx="15" cy="19" r="1" />
                        </svg>
                    </div>
                )}

                {/* Focus Mode Overlay Background */}
                {isFocused && (
                    <div className="absolute top-4 right-4 z-50">
                        <button onClick={() => setIsFocused(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <Minimize2 size={20} />
                        </button>
                    </div>
                )}

                {/* Content Overlay while dragging for safety */}
                {dragHandle && !isFocused && (
                    <div className="absolute inset-0 z-40 bg-transparent pointer-events-none" />
                )}

                {children}
            </motion.div>

            {/* Context Menu Portal */}
            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={menuItems}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </AnimatePresence>

            {/* Backdrop for Focus Mode */}
            {isFocused && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    onClick={() => setIsFocused(false)}
                />
            )}
        </>
    );
};
