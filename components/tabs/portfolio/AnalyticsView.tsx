
import React, { useMemo } from 'react';
import { Investment, CHART_COLORS, InvestmentType } from '../../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Globe, Briefcase, Tag, TrendingDown } from 'lucide-react';

interface AnalyticsViewProps {
    investments: Investment[];
    formatCurrency: (val: number) => string;
    isPrivacyMode: boolean;
}

// Smart Sector Keyword Mapper
const inferSector = (name: string, type: InvestmentType, currentSector?: string): string => {
    if (currentSector && currentSector !== 'Unclassified') return currentSector;

    const n = name.toLowerCase();

    // 1. Check Investment Type first
    if (type === InvestmentType.CRYPTO) return 'Crypto';
    if (type === InvestmentType.DIGITAL_GOLD || type === InvestmentType.DIGITAL_SILVER) return 'Commodities';
    if (type === InvestmentType.REAL_ESTATE) return 'Real Estate';
    if (type === InvestmentType.P2P_LENDING) return 'Lending';

    // 2. Keyword Matching for Stocks/MFs
    if (n.includes('tech') || n.includes('infosys') || n.includes('tcs') || n.includes('wipro') || n.includes('hcl') || n.includes('digital') || n.includes('soft') || n.includes('s&p 500')) return 'Technology';
    if (n.includes('bank') || n.includes('finance') || n.includes('hdfc') || n.includes('kotak') || n.includes('axis') || n.includes('bajaj') || n.includes('icici') || n.includes('sbi') || n.includes('fund')) return 'Financials';
    if (n.includes('pharma') || n.includes('health') || n.includes('dr redox') || n.includes('sun') || n.includes('cipla') || n.includes('apollo')) return 'Healthcare';
    if (n.includes('auto') || n.includes('tata motor') || n.includes('maruti') || n.includes('mahindra') || n.includes('eicher')) return 'Automotive';
    if (n.includes('energy') || n.includes('power') || n.includes('adani') || n.includes('reliance') || n.includes('ntpc') || n.includes('coal')) return 'Energy';
    if (n.includes('consumer') || n.includes('itc') || n.includes('hul') || n.includes('nestle') || n.includes('titan') || n.includes('asian paints')) return 'Consumer Goods';
    if (n.includes('infra') || n.includes('l&t') || n.includes('ultratech') || n.includes('dlf')) return 'Infrastructure';
    if (n.includes('nifty') || n.includes('sensex') || n.includes('index') || n.includes('etf')) return 'Diversified (Index)';

    return 'Other';
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ investments, formatCurrency, isPrivacyMode }) => {

    // Group by Sector (with Smart Inference)
    const sectorData = useMemo(() => {
        const groups: Record<string, number> = {};
        investments.forEach(inv => {
            const sector = inferSector(inv.name, inv.type, inv.sector);
            groups[sector] = (groups[sector] || 0) + inv.currentValue;
        });
        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [investments]);

    // Group by Country
    const countryData = useMemo(() => {
        const groups: Record<string, number> = {};
        investments.forEach(inv => {
            const country = inv.country || 'Unknown';
            groups[country] = (groups[country] || 0) + inv.currentValue;
        });
        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [investments]);

    // Group by Tags
    const tagData = useMemo(() => {
        const groups: Record<string, number> = {};
        investments.forEach(inv => {
            if (inv.tags && inv.tags.length > 0) {
                inv.tags.forEach(tag => {
                    groups[tag] = (groups[tag] || 0) + inv.currentValue;
                });
            } else {
                groups['No Tags'] = (groups['No Tags'] || 0) + inv.currentValue;
            }
        });
        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [investments]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white p-2 rounded-lg text-xs shadow-xl border border-slate-700">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p className="font-mono">{isPrivacyMode ? '••••••' : formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {/* SECTOR BREAKDOWN */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Briefcase size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sector Allocation</h3>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sectorData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {sectorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    {sectorData.slice(0, 6).map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                            <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{entry.name}</span>
                            <span className="font-mono font-bold dark:text-slate-200">{((entry.value / investments.reduce((sum, i) => sum + i.currentValue, 0)) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* COUNTRY EXPOSURE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Globe size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Geographic Exposure</h3>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} stroke="none" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TAG CLOUD */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                        <Tag size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Investment Tags</h3>
                </div>

                <div className="flex flex-wrap gap-3">
                    {tagData.map((tag, i) => (
                        <div key={i} className="group relative px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-default">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">{tag.name}</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {isPrivacyMode ? '••••••' : formatCurrency(tag.value)}
                            </div>
                        </div>
                    ))}
                    {tagData.length === 0 && <p className="text-slate-400 text-sm">No tags found. Edit assets to add tags.</p>}
                </div>
            </div>

            {/* TAX HARVEST OPPORTUNITIES */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tax Harvesting Opportunities</h3>
                        <p className="text-xs text-slate-500">Unrealized losses that can be realized to offset capital gains.</p>
                    </div>
                </div>

                <div className="overflow-hidden">
                    {investments.filter(i => i.currentValue < i.investedAmount).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {investments
                                .filter(i => i.currentValue < i.investedAmount)
                                .sort((a, b) => (a.currentValue - a.investedAmount) - (b.currentValue - b.investedAmount))
                                .map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.name}</p>
                                            <p className="text-xs text-slate-500">{inv.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-rose-500">
                                                {isPrivacyMode ? '••••••' : formatCurrency(inv.currentValue - inv.investedAmount)}
                                            </p>
                                            <p className="text-xs font-mono text-slate-400">
                                                {((inv.currentValue - inv.investedAmount) / inv.investedAmount * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm italic text-center py-4">No significant harvest opportunities found. Great job!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
