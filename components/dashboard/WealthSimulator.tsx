import React from 'react';
import { Sliders } from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, Area, Line, ReferenceLine,
    CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { CustomTooltip } from '../shared/CustomTooltip';

interface WealthSimulatorProps {
    projectionData: any[];
    isDarkMode: boolean;
    formatCurrency: (val: number) => string;
}

const WealthSimulator: React.FC<WealthSimulatorProps> = ({ projectionData, isDarkMode, formatCurrency }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sliders size={20} className="text-indigo-500" /> The Wealth Simulator
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Monte Carlo Projection (1000 Iterations) • Impact of Life Events</p>
                </div>
                <div className="flex gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500/20 rounded"></div> Bull Case (P90)</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded"></div> Base Case (P50)</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500/20 rounded"></div> Bear Case (P10)</div>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="bullRange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="bearRange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                            tickFormatter={(val) => val ? val.slice(0, 4) : ''}
                            interval={90} // Approx quarterly labels
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                            tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />

                        {/* P90 Area */}
                        <Area type="monotone" dataKey="bull" stroke="none" fill="url(#bullRange)" />

                        {/* P10 Area (Red) */}
                        <Area type="monotone" dataKey="bear" stroke="none" fill="url(#bearRange)" />

                        {/* P50 Line (Median) */}
                        <Line type="monotone" dataKey="base" stroke="#6366f1" strokeWidth={3} dot={false} />

                        {/* Life Event Markers */}
                        {projectionData.map((entry, index) => {
                            if (entry.eventMarker) {
                                return <ReferenceLine key={index} x={entry.date} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Event', fill: '#f43f5e', fontSize: 10 }} />;
                            }
                            return null;
                        })}

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WealthSimulator;
