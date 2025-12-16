import React from 'react';
import { Flame } from 'lucide-react';

interface HeatmapWidgetProps {
    history: { date: string, value: number }[];
    isDarkMode: boolean;
}

const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({ history, isDarkMode }) => {
    // Generate last 14 days of data (or use history)
    // For visual appeal, if history is small, we mock or pad
    const dataPoints = history.slice(-14).map((h, i, arr) => {
        const prev = arr[i - 1]?.value || h.value;
        const change = h.value - prev;
        const percent = prev !== 0 ? (change / prev) * 100 : 0;
        return { ...h, change, percent };
    }).reverse(); // Newest first

    const getColor = (percent: number) => {
        if (percent > 0.5) return 'bg-emerald-500';
        if (percent > 0) return 'bg-emerald-400/60';
        if (percent === 0) return 'bg-slate-200 dark:bg-slate-700';
        if (percent > -0.5) return 'bg-rose-400/60';
        return 'bg-rose-500';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Flame size={16} className="text-orange-500" />
                    Portfolio Heat
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Last 14 Days</span>
            </div>

            <div className="flex-1 flex items-end justify-between gap-1">
                {dataPoints.map((pt, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 group w-full">
                        <div
                            className={`w-full rounded-md transition-all group-hover:scale-110 ${getColor(pt.percent)}`}
                            style={{ height: `${Math.min(100, Math.max(20, Math.abs(pt.percent) * 50))}%` }}
                        ></div>
                        {/* Tooltip on Hover via Group */}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>14d ago</span>
                <span>Today</span>
            </div>
        </div>
    );
};

export default HeatmapWidget;
