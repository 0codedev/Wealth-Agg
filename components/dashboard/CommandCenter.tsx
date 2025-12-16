import React from 'react';
import { Activity } from 'lucide-react';
import RoutineClock from '../RoutineClock';
import { MarketStatus } from '../../hooks/useMarketSentiment';

interface CommandCenterProps {
    marketStatus: MarketStatus;
    marketVix: number;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ marketStatus, marketVix }) => {
    const isRed = marketStatus === 'RED';
    const statusColor = isRed ? 'text-rose-500' : marketStatus === 'AMBER' ? 'text-amber-500' : 'text-emerald-500';
    const statusBg = isRed ? 'bg-rose-500/10 border-rose-500/20' : marketStatus === 'AMBER' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2"><RoutineClock /></div>

            <div className={`rounded-xl border p-4 flex flex-col justify-center relative overflow-hidden ${statusBg} transition-all duration-500 h-full min-h-[88px]`}>
                {isRed && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>}

                <div className="flex items-center justify-between relative z-10 w-full h-full">
                    <div className="flex flex-col justify-center">
                        <h3 className={`font-bold text-sm tracking-wider uppercase flex items-center gap-2 ${statusColor}`}>
                            <Activity size={16} /> Market Status
                        </h3>
                        <span className={`text-[10px] font-mono font-bold mt-1 ${isRed ? 'text-rose-400' : 'text-slate-400'}`}>
                            VIX: {marketVix}
                        </span>
                    </div>

                    <div className="text-right">
                        <div className={`text-lg font-black tracking-tight ${statusColor}`}>
                            {isRed ? 'DEFENSIVE' : marketStatus === 'AMBER' ? 'CAUTIOUS' : 'OPTIMAL'}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                            {isRed ? 'CRASH PROTOCOL' : marketStatus === 'AMBER' ? 'VOLATILITY WATCH' : 'STANDARD OPS'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandCenter;
