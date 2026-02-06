import React, { useState, useEffect } from 'react';
import { Search, Command, ArrowRight, Zap, Folder, Settings, Shield, BookOpen, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../services/Logger';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
    group: 'Navigation' | 'Actions' | 'Tools';
}

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    // const navigate = useNavigate(); // Assume Router context is available, or use window.location if not within Router

    // Since we are likely within a Router, we try to use state navigation if possible, 
    // but if this component is mounted at root it needs Router context.
    // For now, let's assume we can emit an event or just window.location.hash for simple tab switching if the app uses hash routing or state.
    // Based on previous files, user seems to have custom tab system in App.tsx?
    // Let's dispatch a custom event 'navigate-tab' that App.tsx can listen to.

    const navigateTo = (tabName: string) => {
        const event = new CustomEvent('navigate-tab', { detail: tabName });
        window.dispatchEvent(event);
        setIsOpen(false);
    };

    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-dash', label: 'Go to Dashboard', group: 'Navigation', icon: <Command size={16} />, action: () => navigateTo('Dashboard') },
        { id: 'nav-port', label: 'Go to Portfolio', group: 'Navigation', icon: <Folder size={16} />, action: () => navigateTo('Portfolio') },
        { id: 'nav-tools', label: 'Go to Tools', group: 'Navigation', icon: <Zap size={16} />, action: () => navigateTo('Tools') },
        { id: 'nav-journal', label: 'Go to Journal', group: 'Navigation', icon: <BookOpen size={16} />, action: () => navigateTo('Journal') },
        { id: 'nav-advisor', label: 'Go to AI Advisor', group: 'Navigation', icon: <User size={16} />, action: () => navigateTo('Advisor') },
        { id: 'nav-settings', label: 'Settings', description: 'Theme, Privacy, Data', group: 'Navigation', icon: <Settings size={16} />, action: () => navigateTo('Settings') },

        // Actions (Mock)
        { id: 'act-add', label: 'Add New Investment', group: 'Actions', icon: <Zap size={16} />, action: () => { logger.debug('Open Add Investment Modal triggered', undefined, 'CommandPalette'); setIsOpen(false); } },
        {
            id: 'act-privacy', label: 'Toggle Privacy Mode', group: 'Actions', icon: <Shield size={16} />, action: () => {
                const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true });
                document.dispatchEvent(event); // Try to trigger existing shortcut? Or just ignore for now.
                setIsOpen(false);
            }
        },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        (cmd.description && cmd.description.toLowerCase().includes(query.toLowerCase()))
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation within list
    useEffect(() => {
        if (!isOpen) return;
        const handleListNav = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
            }
        };
        window.addEventListener('keydown', handleListNav);
        return () => window.removeEventListener('keydown', handleListNav);
    }, [isOpen, filteredCommands, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[60vh]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <Search className="text-slate-400" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <kbd className="hidden md:inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 font-mono text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        ESC
                    </kbd>
                </div>

                <div className="overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No results found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCommands.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={item.action}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-4 transition-colors ${index === selectedIndex
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${index === selectedIndex
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.label}</p>
                                        {item.description && <p className="text-xs opacity-70">{item.description}</p>}
                                    </div>
                                    {index === selectedIndex && <ArrowRight size={16} className="opacity-50" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex justify-between px-4">
                    <span><strong>↑↓</strong> to navigate</span>
                    <span><strong>↵</strong> to select</span>
                </div>
            </div>
        </div>
    );
};
