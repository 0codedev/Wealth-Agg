import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Command, Search, X, Zap,
    Calendar, LayoutDashboard, Grid,
    Filter, TrendingUp, TrendingDown, AlertTriangle
} from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

// This component will be portal'd or just fixed overlay
const JournalCommandCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    // Toggle Command Center
    useHotkeys('ctrl+k, meta+k', (e) => {
        e.preventDefault();
        setIsOpen(prev => !prev);
    });

    // Close on Escape
    useHotkeys('escape', () => setIsOpen(false));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-white/5">
                        <Search className="text-slate-500" size={20} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Type a command or filter..."
                            className="flex-1 bg-transparent text-lg text-white placeholder-slate-500 outline-none"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-slate-400">ESC</span>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="p-2 max-h-[300px] overflow-y-auto">

                        {/* Navigation Group */}
                        <div className="mb-2">
                            <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</p>
                            <div className="space-y-1">
                                <CommandItem icon={LayoutDashboard} label="Go to Analytics" shortcut="G then A" />
                                <CommandItem icon={Calendar} label="Go to Journal" shortcut="G then J" />
                                <CommandItem icon={Grid} label="Go to Playbook" shortcut="G then P" />
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="mb-2">
                            <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</p>
                            <div className="space-y-1">
                                <CommandItem icon={Zap} label="Log New Trade" shortcut="CTRL+N" />
                                <CommandItem icon={LayoutDashboard} label="Add Daily Review" />
                            </div>
                        </div>

                        {/* Filters Group (Mock functionality for now) */}
                        <div>
                            <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Filters</p>
                            <div className="space-y-1">
                                <CommandItem icon={TrendingUp} label="Show Recent Wins" />
                                <CommandItem icon={TrendingDown} label="Show Recent Losses" />
                                <CommandItem icon={AlertTriangle} label="Filter: Revenge Trading" />
                            </div>
                        </div>

                    </div>

                    <div className="p-3 bg-slate-950/50 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                        <span>Navigation, filtering, and actions at your fingertips.</span>
                        <div className="flex items-center gap-2">
                            <Command size={12} /> <span className="font-mono">Open Command Center</span>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const CommandItem = ({ icon: Icon, label, shortcut }: { icon: any, label: string, shortcut?: string }) => (
    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-indigo-600/10 hover:text-indigo-400 text-slate-300 transition-colors group text-left">
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-slate-500 group-hover:text-indigo-400" />
            <span className="font-medium">{label}</span>
        </div>
        {shortcut && <span className="text-xs font-mono text-slate-600 group-hover:text-indigo-400/70">{shortcut}</span>}
    </button>
);

export default JournalCommandCenter;
