import React from 'react';
import { BarChart4 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface CapitalStackProps {
    totalCash: number;
    availableCapital: number;
    displayTotal: number;
    isCapitalDanger: boolean;
    stackData: { name: string; amount: number; count: number }[];
}

const STACK_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];

export const CapitalStack = React.memo(({ totalCash, availableCapital, displayTotal, isCapitalDanger, stackData }: CapitalStackProps) => {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <BarChart4 size={14} /> Capital Stack
                    </p>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">
                        Total Liquidity: <span className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrency(totalCash)}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${isCapitalDanger ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatCurrency(availableCapital)}
                    </p>
                    <p className="text-xs uppercase font-bold text-slate-400">Available</p>
                </div>
            </div>

            <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex shadow-inner relative">
                {stackData.map((item, idx) => {
                    const width = (item.amount / displayTotal) * 100;
                    return (
                        <div
                            key={item.name}
                            className={`h-full ${STACK_COLORS[idx % STACK_COLORS.length]} border-r border-slate-900/10 flex items-center justify-center text-[10px] font-bold text-white whitespace-nowrap overflow-hidden transition-all hover:opacity-90`}
                            style={{ width: `${width}%` }}
                            title={`${item.name}: ${formatCurrency(item.amount)}`}
                        >
                            {width > 10 && `${item.name}`}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
