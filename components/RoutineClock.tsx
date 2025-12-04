import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Zap, Coffee, Activity, BarChart3 } from 'lucide-react';

type Slot = 'PRE_MARKET' | 'MARKET_OPEN' | 'POWER_HOUR_OPEN' | 'POWER_HOUR_CLOSE' | 'POST_MARKET' | 'REST';

const RoutineClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [currentSlot, setCurrentSlot] = useState<Slot>('REST');
  const [nextSlotInfo, setNextSlotInfo] = useState({ name: '', diff: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      updateSlots(now);
    }, 1000);

    updateSlots(new Date());

    return () => clearInterval(timer);
  }, []);

  const updateSlots = (now: Date) => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // IST Market Timings
    // 09:00 (540) - 09:15 (555): PRE_MARKET
    // 09:15 (555) - 10:15 (615): POWER_HOUR_OPEN (Volatility)
    // 10:15 (615) - 14:30 (870): MARKET_OPEN (General)
    // 14:30 (870) - 15:30 (930): POWER_HOUR_CLOSE (Closing Moves)
    // 15:30 (930) - 16:00 (960): POST_MARKET
    
    let slot: Slot = 'REST';
    let next: { name: string, startMinutes: number } | null = null;

    if (totalMinutes >= 540 && totalMinutes < 555) slot = 'PRE_MARKET';
    else if (totalMinutes >= 555 && totalMinutes < 615) slot = 'POWER_HOUR_OPEN';
    else if (totalMinutes >= 615 && totalMinutes < 870) slot = 'MARKET_OPEN';
    else if (totalMinutes >= 870 && totalMinutes < 930) slot = 'POWER_HOUR_CLOSE';
    else if (totalMinutes >= 930 && totalMinutes < 960) slot = 'POST_MARKET';

    // Determine next slot
    if (totalMinutes < 540) next = { name: 'Pre-Market', startMinutes: 540 };
    else if (totalMinutes < 555) next = { name: 'Market Open', startMinutes: 555 };
    else if (totalMinutes < 930) next = { name: 'Market Close', startMinutes: 930 };
    else if (totalMinutes < 960) next = { name: 'Post-Market End', startMinutes: 960 };
    else next = { name: 'Pre-Market (Tom)', startMinutes: 540 + 1440 }; // Tomorrow

    setCurrentSlot(slot);

    if (next) {
        let diff = next.startMinutes * 60 - (hours * 3600 + minutes * 60 + now.getSeconds());
        setNextSlotInfo({ name: next.name, diff });
    }
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "NOW";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const getSlotDetails = (slot: Slot) => {
      switch(slot) {
          case 'PRE_MARKET':
              return {
                  label: 'PRE-MARKET',
                  desc: '09:00 - 09:15. Check Global Cues. No Orders.',
                  icon: Sun,
                  color: 'text-amber-600 dark:text-amber-500',
                  bg: 'bg-amber-500/10 border-amber-500/20',
                  pulse: true
              };
          case 'POWER_HOUR_OPEN':
              return {
                  label: 'OPENING BELL',
                  desc: '09:15 - 10:15. High Volatility. Execute Setups.',
                  icon: Zap,
                  color: 'text-emerald-600 dark:text-emerald-500',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                  pulse: true
              };
          case 'MARKET_OPEN':
              return {
                  label: 'MARKET SESSION',
                  desc: 'Live Trading. Monitor Positions.',
                  icon: Activity,
                  color: 'text-indigo-600 dark:text-indigo-500',
                  bg: 'bg-indigo-500/10 border-indigo-500/20',
                  pulse: false
              };
          case 'POWER_HOUR_CLOSE':
              return {
                  label: 'CLOSING HOUR',
                  desc: '14:30 - 15:30. Intraday Exits. BTST Decisions.',
                  icon: Zap,
                  color: 'text-fuchsia-600 dark:text-fuchsia-500',
                  bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
                  pulse: true
              };
          case 'POST_MARKET':
              return {
                  label: 'POST-MARKET',
                  desc: '15:30 - 16:00. Settlement & Analysis.',
                  icon: BarChart3,
                  color: 'text-slate-600 dark:text-slate-400',
                  bg: 'bg-slate-200/50 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
                  pulse: false
              };
          default:
              return {
                  label: 'MARKET CLOSED',
                  desc: 'Relax. Prepare for tomorrow.',
                  icon: Moon,
                  color: 'text-slate-400',
                  bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                  pulse: false
              };
      }
  };

  const details = getSlotDetails(currentSlot);
  const Icon = details.icon;

  return (
    <div className={`rounded-xl p-4 border flex items-center justify-between ${details.bg} transition-all duration-500`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm ${details.color} ${details.pulse ? 'animate-pulse' : ''}`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className={`font-bold text-sm tracking-wider uppercase ${details.color} flex items-center gap-2`}>
                    {details.label}
                    {details.pulse && <span className="flex h-2 w-2 rounded-full bg-current animate-ping"/>}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {details.desc}
                </p>
            </div>
        </div>

        <div className="text-right hidden sm:block">
            {currentSlot === 'REST' ? (
                <>
                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Next: {nextSlotInfo.name}</p>
                    <p className="text-xl font-mono font-bold text-slate-700 dark:text-slate-200">
                        -{formatCountdown(nextSlotInfo.diff)}
                    </p>
                </>
            ) : (
                <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                        <Activity size={14} className={details.color} /> 
                        {formatCountdown(nextSlotInfo.diff)} left
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};

export default RoutineClock;