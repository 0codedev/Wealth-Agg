import React, { useState, useEffect } from 'react';
import { LayoutGrid, Eye, EyeOff, ArrowUp, ArrowDown, Move, Check } from 'lucide-react';

interface DashboardGridProps {
    renderWidget: (id: string) => React.ReactNode;
}

// Default layout spans (1 = 1/3 width, 2 = 2/3 width, 3 = Full width)
const DEFAULT_SPANS: Record<string, number> = {
    'project-5l': 3,
    'fortress-hub': 3,
    'calendar': 3,
    'wealth-simulator': 3,
    'milestone-timeline': 3,
    'runway-gauge': 3,
    'liability-watchdog': 3,
    'heatmap': 3,
    'alerts-widget': 3,
    // Hubs generally full width
    'smart-actions-widget': 3,
    // Mid-size
    'tax-harvesting': 2,
    'ai-copilot': 2,
    'fire-dashboard': 2,
    'correlation-matrix': 2,
    'rebalancing-wizard': 2,
    'goal-thermometer': 2,
    // Defaults to 1 (Standard Widgets)
};

const AVAILABLE_WIDGETS = [
    { id: 'total-pl', label: 'Portfolio Summary', default: true },
    { id: 'top-performer', label: 'Top Performer', default: true },
    { id: 'spending-widget', label: 'Spending Trend', default: true },
    { id: 'tax-harvesting', label: 'Tax Alpha', default: true },
    { id: 'market-widget', label: 'Market Insights', default: true },
    { id: 'community-widget', label: 'Community', default: true },
    { id: 'loan-widget', label: 'Liabilities', default: true },
    { id: 'fire-dashboard', label: 'FIRE Progress', default: true },
    { id: 'project-5l', label: 'Project 5L', default: true },
    { id: 'exposure-chart', label: 'Asset Exposure', default: true },
    { id: 'platform-chart', label: 'Platform Split', default: false },
    { id: 'ai-copilot', label: 'AI Copilot', default: false },
    { id: 'calendar', label: 'Financial Calendar', default: false },
    { id: 'wealth-simulator', label: 'Wealth Simulator', default: true },
    { id: 'heatmap', label: 'Market Heatmap', default: true },
    { id: 'alerts-widget', label: 'Smart Alerts', default: true },
    { id: 'fortress-hub', label: 'Fortress Hub', default: false },
    { id: 'rebalancing-wizard', label: 'Rebalancing', default: false },
    { id: 'runway-gauge', label: 'Runway Gauge', default: false },
    { id: 'liability-watchdog', label: 'Liability Watchdog', default: false },
    { id: 'goal-thermometer', label: 'Goal Thermometer', default: false },
    { id: 'milestone-timeline', label: 'Milestone Timeline', default: true },
];

export const DashboardGrid: React.FC<DashboardGridProps> = ({ renderWidget }) => {
    const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
    const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
    const [widgetSpans, setWidgetSpans] = useState<Record<string, number>>({});
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Initialize
    useEffect(() => {
        const savedOrder = localStorage.getItem('dash_widget_order_v2');
        const savedHidden = localStorage.getItem('dash_hidden_widgets_v2');
        const savedSpans = localStorage.getItem('dash_widget_spans_v1');

        if (savedOrder) {
            setWidgetOrder(JSON.parse(savedOrder));
        } else {
            setWidgetOrder(AVAILABLE_WIDGETS.map(w => w.id));
        }

        if (savedHidden) {
            setHiddenWidgets(JSON.parse(savedHidden));
        }

        if (savedSpans) {
            setWidgetSpans(JSON.parse(savedSpans));
        } else {
            setWidgetSpans(DEFAULT_SPANS);
        }
    }, []);

    // Save needs to track AVAILABLE_WIDGETS changes if we want new defaults to show up, 
    // but for now we just load what's saved. If 'tax-harvesting' isn't in savedOrder, it won't show.
    // We might need to force append it if it's missing and we heavily rely on saved order.
    // Actually, line 70 maps AVAILABLE_WIDGETS if no saved order. 
    // If user has saved order, 'tax-harvesting' won't appear unless they reset.
    // I should inject it if missing from savedOrder.

    useEffect(() => {
        setWidgetOrder(prev => {
            if (prev.length === 0) return prev;
            if (!prev.includes('tax-harvesting')) {
                // Determine insertion index (e.g. after spending-widget)
                const spendIndex = prev.indexOf('spending-widget');
                const newOrder = [...prev];
                if (spendIndex !== -1) newOrder.splice(spendIndex + 1, 0, 'tax-harvesting');
                else newOrder.push('tax-harvesting');
                return newOrder;
            }
            return prev;
        })
    }, []);

    // Save
    useEffect(() => {
        if (widgetOrder.length > 0) localStorage.setItem('dash_widget_order_v2', JSON.stringify(widgetOrder));
        if (hiddenWidgets) localStorage.setItem('dash_hidden_widgets_v2', JSON.stringify(hiddenWidgets));
        if (Object.keys(widgetSpans).length > 0) localStorage.setItem('dash_widget_spans_v1', JSON.stringify(widgetSpans));
    }, [widgetOrder, hiddenWidgets, widgetSpans]);

    const moveWidget = (index: number, direction: 'UP' | 'DOWN') => {
        const newOrder = [...widgetOrder];
        if (direction === 'UP' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'DOWN' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        setWidgetOrder(newOrder);
    };

    const toggleVisibility = (id: string) => {
        if (hiddenWidgets.includes(id)) {
            setHiddenWidgets(hiddenWidgets.filter(w => w !== id));
        } else {
            setHiddenWidgets([...hiddenWidgets, id]);
        }
    };

    const updateSpan = (id: string, span: number) => {
        setWidgetSpans(prev => ({ ...prev, [id]: span }));
    };

    const getSpanClass = (id: string) => {
        const span = widgetSpans[id] || DEFAULT_SPANS[id] || 1;
        if (span === 3) return 'md:col-span-3'; // Full width on desktop
        if (span === 2) return 'md:col-span-2'; // 2/3 width
        return 'md:col-span-1'; // 1/3 width
    };

    return (
        <div className="space-y-6">
            {/* Customization Toggle */}
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${isCustomizing
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-indigo-200 dark:shadow-indigo-900/20'
                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:shadow-md border border-slate-200 dark:border-slate-800'
                        }`}
                >
                    {isCustomizing ? <Check size={16} /> : <LayoutGrid size={16} />}
                    {isCustomizing ? 'Done Editing' : 'Customize Layout'}
                </button>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {widgetOrder.map((id, index) => {
                    const widgetDef = AVAILABLE_WIDGETS.find(w => w.id === id);
                    if (!widgetDef) return null;

                    const isHidden = hiddenWidgets.includes(id);

                    if (!isCustomizing && isHidden) return null;

                    const currentSpan = widgetSpans[id] || DEFAULT_SPANS[id] || 1;
                    const spanClass = getSpanClass(id);

                    return (
                        <div
                            key={id}
                            className={`relative transition-all duration-300 ${spanClass} ${isCustomizing
                                ? 'rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 min-h-[160px]'
                                : ''
                                } ${isHidden && isCustomizing ? 'opacity-40 grayscale' : ''}`}
                        >
                            {isCustomizing ? (
                                <div className="flex flex-col h-full gap-4">
                                    {/* Header: Label & Move/Hide Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {isHidden ? 'Hidden: ' : ''}{widgetDef.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                            <button
                                                onClick={() => moveWidget(index, 'UP')}
                                                disabled={index === 0}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-30 text-slate-600 dark:text-slate-400"
                                                title="Move Up"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveWidget(index, 'DOWN')}
                                                disabled={index === widgetOrder.length - 1}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-30 text-slate-600 dark:text-slate-400"
                                                title="Move Down"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                            <button
                                                onClick={() => toggleVisibility(id)}
                                                className={`p-1.5 rounded-md ${isHidden ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                title={isHidden ? "Show Widget" : "Hide Widget"}
                                            >
                                                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Center: Placeholder Icon */}
                                    <div className="flex-1 flex items-center justify-center opacity-30">
                                        <Move className="text-slate-400" size={32} />
                                    </div>

                                    {/* Footer: Resize Controls */}
                                    <div className="flex justify-center">
                                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                            {[1, 2, 3].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => updateSpan(id, size)}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${currentSpan === size
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {size === 1 ? 'Small' : size === 2 ? 'Medium' : 'Full'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full">
                                    {renderWidget(id)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
