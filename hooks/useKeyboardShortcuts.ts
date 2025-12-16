import { useEffect, useCallback, useState } from 'react';

interface Shortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
}

interface KeyboardShortcutsResult {
    isHelpOpen: boolean;
    toggleHelp: () => void;
    shortcuts: Shortcut[];
}

/**
 * Global keyboard shortcuts hook
 * Provides power-user navigation and actions
 * 
 * Default shortcuts:
 * - ? : Show help
 * - Ctrl+K : Global search
 * - Ctrl+N : New asset
 * - Ctrl+, : Settings
 * - Escape : Close modal/clear
 * 
 * @example
 * const { isHelpOpen, toggleHelp } = useKeyboardShortcuts({
 *   onSearch: () => setSearchOpen(true),
 *   onNewAsset: () => setAddModalOpen(true),
 * });
 */
export function useKeyboardShortcuts(handlers: {
    onSearch?: () => void;
    onNewAsset?: () => void;
    onSettings?: () => void;
    onEscape?: () => void;
    onNavigate?: (tab: string) => void;
}): KeyboardShortcutsResult {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const toggleHelp = useCallback(() => {
        setIsHelpOpen(prev => !prev);
    }, []);

    const shortcuts: Shortcut[] = [
        {
            key: '?',
            description: 'Show keyboard shortcuts',
            action: toggleHelp,
        },
        {
            key: 'k',
            ctrlKey: true,
            description: 'Global search',
            action: () => handlers.onSearch?.(),
        },
        {
            key: 'n',
            ctrlKey: true,
            description: 'Add new asset',
            action: () => handlers.onNewAsset?.(),
        },
        {
            key: ',',
            ctrlKey: true,
            description: 'Open settings',
            action: () => handlers.onSettings?.(),
        },
        {
            key: 'Escape',
            description: 'Close modal / Clear selection',
            action: () => {
                setIsHelpOpen(false);
                handlers.onEscape?.();
            },
        },
        {
            key: '1',
            altKey: true,
            description: 'Go to Dashboard',
            action: () => handlers.onNavigate?.('dashboard'),
        },
        {
            key: '2',
            altKey: true,
            description: 'Go to Portfolio',
            action: () => handlers.onNavigate?.('portfolio'),
        },
        {
            key: '3',
            altKey: true,
            description: 'Go to AI Advisor',
            action: () => handlers.onNavigate?.('advisor'),
        },
        {
            key: '4',
            altKey: true,
            description: 'Go to Academy',
            action: () => handlers.onNavigate?.('academy'),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Allow Escape to close
                if (e.key === 'Escape') {
                    handlers.onEscape?.();
                }
                return;
            }

            // Find matching shortcut
            const matchedShortcut = shortcuts.find(shortcut => {
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                    e.key === shortcut.key;
                const ctrlMatch = !!shortcut.ctrlKey === (e.ctrlKey || e.metaKey);
                const shiftMatch = !!shortcut.shiftKey === e.shiftKey;
                const altMatch = !!shortcut.altKey === e.altKey;

                return keyMatch && ctrlMatch && shiftMatch && altMatch;
            });

            if (matchedShortcut) {
                e.preventDefault();
                matchedShortcut.action();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, handlers]);

    return {
        isHelpOpen,
        toggleHelp,
        shortcuts,
    };
}

// Format shortcut for display
export function formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('⌘');

    const keyDisplay = shortcut.key === 'Escape' ? 'Esc' :
        shortcut.key === ' ' ? 'Space' :
            shortcut.key.toUpperCase();
    parts.push(keyDisplay);

    return parts.join(' + ');
}

export default useKeyboardShortcuts;
