
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, CheckCircle2, Activity, Layers, Eye, EyeOff } from 'lucide-react';
import { Trade, DailyReview } from '../../database';
import { formatCurrency } from '../../utils/helpers';

interface PnLCalendarProps {
  trades: Trade[];
  dailyReviews?: DailyReview[];
  onDateSelect: (date: string | null) => void;
  selectedDate: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MARKET_COLORS: Record<string, string> = {
  'Trending': 'bg-emerald-500',
  'Choppy': 'bg-amber-500',
  'Volatile': 'bg-fuchsia-500',
  'Sideways': 'bg-slate-400'
};

const PnLCalendar: React.FC<PnLCalendarProps> = ({ trades, dailyReviews = [], onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOverlay, setShowOverlay] = useState(false);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // --- Data Aggregation ---
  const dailyData = useMemo(() => {
    const map: Record<string, { pnl: number, count: number, wins: number, marketCondition?: string }> = {};

    trades.forEach(t => {
      const dateStr = t.date; // YYYY-MM-DD
      if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0, wins: 0 };

      map[dateStr].pnl += (t.pnl || 0);
      map[dateStr].count += 1;
      if ((t.pnl || 0) > 0) map[dateStr].wins += 1;
    });

    // Map Market Conditions
    dailyReviews.forEach(r => {
      if (map[r.date]) {
        map[r.date].marketCondition = r.marketCondition;
      } else {
        // Even if no trades, we might want to show market condition if overlay is on
        // But usually we only care about correlating with PnL
        map[r.date] = { pnl: 0, count: 0, wins: 0, marketCondition: r.marketCondition };
      }
    });

    return map;
  }, [trades, dailyReviews]);

  const monthStats = useMemo(() => {
    let totalPnL = 0;
    let wins = 0;
    let losses = 0;
    let tradeCount = 0;

    Object.entries(dailyData).forEach(([date, data]) => {
      const d = data as { pnl: number, count: number, wins: number };
      if (new Date(date).getMonth() === month && new Date(date).getFullYear() === year && d.count > 0) {
        totalPnL += d.pnl;
        tradeCount += d.count;
        if (d.pnl > 0) wins++;
        else if (d.pnl < 0) losses++;
      }
    });

    return { totalPnL, wins, losses, tradeCount };
  }, [dailyData, month, year]);

  // --- Handlers ---
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectedDate === dateStr) {
      onDateSelect(null); // Deselect
    } else {
      onDateSelect(dateStr);
    }
  };

  // --- Render Helpers ---
  const renderDayCell = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return <div className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl opacity-50 pointer-events-none"></div>;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dailyData[dateStr];
    const hasTrades = !!data && data.count > 0;
    const isProfit = hasTrades && data.pnl >= 0;
    const isSelected = selectedDate === dateStr;
    const marketColor = data?.marketCondition ? MARKET_COLORS[data.marketCondition] : null;

    return (
      <div
        onClick={() => handleDateClick(day)}
        className={`h-24 md:h-32 rounded-2xl border p-2 relative transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-lg overflow-hidden
          ${isSelected
            ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950'
            : 'border-slate-200 dark:border-slate-800'
          }
          ${!hasTrades
            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
            : isProfit
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
              : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30'
          }
        `}
      >
        {/* Market Context Overlay */}
        {showOverlay && marketColor && (
          <div
            className={`absolute top-0 right-0 w-8 h-8 -mr-4 -mt-4 transform rotate-45 ${marketColor} opacity-80 z-10 shadow-sm`}
            title={`Market: ${data.marketCondition}`}
          ></div>
        )}

        <div className="flex justify-between items-start relative z-0">
          <span className={`text-sm font-bold ${hasTrades ? (isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400') : 'text-slate-400'}`}>
            {day}
          </span>
          {hasTrades && (
            <span className="text-[10px] font-bold bg-white/80 dark:bg-black/20 px-1.5 py-0.5 rounded-md backdrop-blur-sm text-slate-500">
              {data.count}T
            </span>
          )}
        </div>

        {hasTrades && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className={`text-sm md:text-base font-black tracking-tight ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isProfit ? '+' : ''}{formatCurrency(data.pnl)}
            </div>
            <div className="flex gap-1 mt-1">
              {/* Mini Dots for trade wins/losses visualization */}
              {Array.from({ length: Math.min(data.count, 5) }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < data.wins ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              ))}
              {data.count > 5 && <span className="text-[8px] text-slate-400 leading-none">+</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Month Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all text-slate-500">
              <ChevronLeft size={20} />
            </button>
            <h2 className="w-40 text-center font-bold text-lg text-slate-800 dark:text-white">
              {MONTHS[month]} <span className="text-indigo-500">{year}</span>
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all text-slate-500">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Correlation Overlay Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${showOverlay ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
          >
            {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden sm:inline">Correlation Overlay</span>
          </button>
        </div>

        <div className="flex gap-4 md:gap-8">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Net P&L</p>
            <p className={`text-lg font-black font-mono ${monthStats.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {monthStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(monthStats.totalPnL)}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Win Rate</p>
            <p className="text-lg font-black text-slate-700 dark:text-slate-300">
              {monthStats.tradeCount > 0 ? ((monthStats.wins / monthStats.tradeCount) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="flex flex-wrap gap-4 justify-center bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Trending</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Choppy</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-fuchsia-500"></div> Volatile</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Sideways</div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="grid grid-cols-7 mb-4">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {/* Empty slots for previous month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            renderDayCell(i, false)
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => (
            renderDayCell(i + 1, true)
          ))}
        </div>
      </div>
    </div>
  );
};

export default PnLCalendar;
