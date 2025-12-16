import React from 'react';
import { formatCurrency } from '../../utils/helpers';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    isPrivacyMode?: boolean;
    formatter?: (value: any, name: string, entry: any) => string | number;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isPrivacyMode, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                    <p className="font-bold text-slate-200 text-sm">{label}</p>
                </div>
                <div className="p-4 space-y-2.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-slate-900" style={{ backgroundColor: entry.color || entry.fill }}></div>
                                <span className="text-slate-400 font-medium">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-white tracking-wide">
                                {isPrivacyMode ? '••••••' : (formatter ? formatter(entry.value, entry.name, entry) : (typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
