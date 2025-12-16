import React from 'react';
import { Book, Star, Edit2, Plus, List } from 'lucide-react';
import PnLCalendar from './PnLCalendar';
import TradeHistoryTable from './TradeHistoryTable';
import { Trade, DailyReview } from '../../database';

interface JournalCalendarViewProps {
    trades: Trade[];
    dailyReviews: DailyReview[];
    selectedCalendarDate: string | null;
    setSelectedCalendarDate: (date: string | null) => void;
    selectedDayReview: DailyReview | null;
    onOpenDailyReviewModal: () => void;
}

const JournalCalendarView: React.FC<JournalCalendarViewProps> = ({
    trades,
    dailyReviews,
    selectedCalendarDate,
    setSelectedCalendarDate,
    selectedDayReview,
    onOpenDailyReviewModal
}) => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <PnLCalendar
                trades={trades}
                dailyReviews={dailyReviews}
                selectedDate={selectedCalendarDate}
                onDateSelect={setSelectedCalendarDate}
            />

            {/* Daily Report Card Section */}
            {selectedCalendarDate && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    {selectedDayReview ? (
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Book size={20} className="text-indigo-500" /> Daily Report Card
                                    </h3>
                                    <p className="text-sm text-slate-500">Self-Review for {selectedCalendarDate}</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className={selectedDayReview.rating >= s ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700"} />)}
                                    </div>
                                    <button onClick={onOpenDailyReviewModal} className="ml-4 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">What went well</span>
                                    <p className="text-slate-700 dark:text-slate-300">{selectedDayReview.didWell || 'No notes.'}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-xs font-bold text-rose-500 uppercase block mb-1">What went wrong</span>
                                    <p className="text-slate-700 dark:text-slate-300">{selectedDayReview.didPoorly || 'No notes.'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-slate-500 mb-4">No daily review logged for {selectedCalendarDate}.</p>
                            <button
                                onClick={onOpenDailyReviewModal}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Daily Review
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <List size={20} className="text-indigo-500" />
                        {selectedCalendarDate ? `Log for ${selectedCalendarDate}` : 'Comprehensive Trade Log'}
                    </h3>
                    {selectedCalendarDate && (
                        <button
                            onClick={() => setSelectedCalendarDate(null)}
                            className="text-xs text-indigo-500 font-bold hover:underline"
                        >
                            Show All
                        </button>
                    )}
                </div>
                <TradeHistoryTable trades={trades} />
            </div>
        </div>
    );
};

export default JournalCalendarView;
