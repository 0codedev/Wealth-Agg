
import React, { useState, useEffect } from 'react';
import { X, Star, Save, Calendar, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import { db, DailyReview } from '../../database';

interface DailyReviewModalProps {
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const MARKET_CONDITIONS = ['Trending', 'Choppy', 'Volatile', 'Sideways'];

const DailyReviewModal: React.FC<DailyReviewModalProps> = ({ date, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<DailyReview>({
    date,
    rating: 3,
    marketCondition: 'Sideways',
    notes: '',
    didWell: '',
    didPoorly: ''
  });

  useEffect(() => {
    if (isOpen && date) {
      loadReview();
    }
  }, [isOpen, date]);

  const loadReview = async () => {
    const existing = await db.daily_reviews.get(date);
    if (existing) {
        setFormData(existing);
    } else {
        // Reset for new date
        setFormData({
            date,
            rating: 3,
            marketCondition: 'Sideways',
            notes: '',
            didWell: '',
            didPoorly: ''
        });
    }
  };

  const handleSave = async () => {
    await db.daily_reviews.put(formData);
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
           <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                   <Calendar size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       Daily Report Card
                   </h2>
                   <p className="text-xs text-slate-500 font-mono tracking-wider">{date}</p>
               </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
               <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            
            {/* Rating Section */}
            <div className="flex flex-col items-center py-4 border-b border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3">Performance Grade</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star}
                            onClick={() => setFormData({...formData, rating: star})}
                            className={`p-2 rounded-full transition-all ${formData.rating >= star ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'}`}
                        >
                            <Star size={32} fill={formData.rating >= star ? "currentColor" : "none"} />
                        </button>
                    ))}
                </div>
                <p className="text-sm font-bold mt-2 text-indigo-600 dark:text-indigo-400">
                    {formData.rating === 5 ? 'Elite Performance' : 
                     formData.rating === 4 ? 'Solid Execution' :
                     formData.rating === 3 ? 'Average Day' :
                     formData.rating === 2 ? 'Subpar' : 'Disaster'}
                </p>
            </div>

            {/* Market Conditions */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Market Context</label>
                <div className="flex gap-2">
                    {MARKET_CONDITIONS.map(cond => (
                        <button
                            key={cond}
                            onClick={() => setFormData({...formData, marketCondition: cond as any})}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.marketCondition === cond ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}
                        >
                            {cond}
                        </button>
                    ))}
                </div>
            </div>

            {/* The Mirror */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase flex items-center gap-1">
                        <ThumbsUp size={12}/> What Went Well?
                    </label>
                    <textarea 
                        value={formData.didWell}
                        onChange={(e) => setFormData({...formData, didWell: e.target.value})}
                        className="w-full h-24 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 resize-none"
                        placeholder="Discipline, Patience..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase flex items-center gap-1">
                        <ThumbsDown size={12}/> What Went Wrong?
                    </label>
                    <textarea 
                        value={formData.didPoorly}
                        onChange={(e) => setFormData({...formData, didPoorly: e.target.value})}
                        className="w-full h-24 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3 text-sm outline-none focus:border-rose-500 resize-none"
                        placeholder="FOMO, Revenge..."
                    />
                </div>
            </div>

            {/* General Notes */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">General Journal Notes</label>
                <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 resize-none"
                    placeholder="Reflections on the session..."
                />
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
            <button 
                onClick={handleSave}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
            >
                <Save size={18}/> Save Report
            </button>
        </div>
      </div>
    </div>
  );
};

export default DailyReviewModal;
