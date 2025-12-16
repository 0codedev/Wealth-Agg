import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Save, Upload, Target, ShieldAlert, ListChecks, CheckSquare, Award, Clock, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useTradeForm } from '../hooks/useTradeForm';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const MOODS_ENTRY = [
  { label: 'Focused', emoji: '🎯', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400' },
  { label: 'Anxious', emoji: '😰', color: 'border-amber-500 text-amber-600 dark:text-amber-400' },
  { label: 'Bored', emoji: '🥱', color: 'border-slate-500 text-slate-600 dark:text-slate-400' },
  { label: 'Revenge', emoji: '😡', color: 'border-rose-500 text-rose-600 dark:text-rose-400' },
  { label: 'Greedy', emoji: '🤑', color: 'border-green-400 text-green-600 dark:text-green-300' },
];

const MISTAKE_TAGS = ['FOMO', 'Chasing', 'No Stop Loss', 'Overleveraged', 'Early Exit', 'Hesitation', 'Revenge Trade', 'News Trading'];
const GRADES = ['A+', 'A', 'B', 'C', 'D'];

const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, onSave }) => {
  const {
    step, formData, strategies, selectedStrategy, checkedRules, totalCapital, riskData, isCompressing, previewUrl, newMistake,
    setNewMistake, setTotalCapital, updateField, toggleMistake, handleAddMistake, handleRuleToggle, handleFileChange, handleSubmit,
    nextStep, prevStep, fileInputRef
  } = useTradeForm(isOpen, onSave, onClose);

  if (!isOpen) return null;

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <div
        className={`w-full max-w-2xl bg-slate-900/90 backdrop-blur-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 
        ${riskData.isViolation ? 'border-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]' : 'border-slate-800 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${riskData.isViolation ? 'bg-rose-900/20 text-rose-500 border-rose-500/30' : 'bg-indigo-900/20 text-indigo-500 border-indigo-500/30'}`}>
              {riskData.isViolation ? <ShieldAlert size={20} className="animate-pulse" /> : <Target size={20} />}
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-wide ${riskData.isViolation ? 'text-rose-500' : 'text-white'}`}>
                {riskData.isViolation ? 'HARD DECK BREACHED' : 'Log New Trade'}
              </h2>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                Step {step} / 4
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative min-h-[400px]">
          <AnimatePresence mode="wait" custom={step}>

            {/* STEP 1: STRATEGY & RULES */}
            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Strategy Vault</h3>
                  <p className="text-slate-400 text-sm">Define your edge. Follow the rules.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Ticker</label>
                    <input
                      type="text"
                      value={formData.ticker || ''}
                      onChange={e => updateField('ticker', e.target.value.toUpperCase())}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono tracking-wider"
                      placeholder="e.g., BTCUSD"
                      autoFocus
                    />
                  </div>

                  {/* Strategy Selector */}
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Strategy (The Setup)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {strategies.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updateField('setup', s.name)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${formData.setup === s.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                          <span className="block font-bold">{s.name}</span>
                          <span className="text-[10px] opacity-70 truncate block">{s.description}</span>
                        </button>
                      ))}
                      {strategies.length === 0 && <p className="text-xs text-slate-500 col-span-2">No strategies found. Add them in the Dashboard.</p>}
                    </div>
                  </div>

                  {/* Pre-Trade Checklist (Dynamic) */}
                  {selectedStrategy && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-1">
                          <ListChecks size={14} /> Execution Checklist
                        </h4>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${formData.complianceScore === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          Score: {formData.complianceScore}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        {selectedStrategy.rules.map((rule, idx) => (
                          <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${checkedRules[idx] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 group-hover:border-indigo-500'}`}>
                              {checkedRules[idx] && <CheckSquare size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={checkedRules[idx]} onChange={() => handleRuleToggle(idx)} />
                            <span className={`text-sm ${checkedRules[idx] ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-300'}`}>{rule}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Award size={12} /> Grade</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => updateField('grade', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Direction</label>
                      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => updateField('direction', 'Long')} className={`flex-1 py-2 rounded text-xs font-bold ${formData.direction === 'Long' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>LONG</button>
                        <button onClick={() => updateField('direction', 'Short')} className={`flex-1 py-2 rounded text-xs font-bold ${formData.direction === 'Short' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}>SHORT</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Date</label>
                      <input type="date" value={formData.date || ''} onChange={e => updateField('date', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Clock size={10} /> Entry Time</label>
                      <input type="time" value={formData.entryTime || ''} onChange={e => updateField('entryTime', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: MINDSET */}
            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Psych Check</h3>
                  <p className="text-slate-400 text-sm">Data for the Tilt-O-Meter.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">Entry Mood</label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {MOODS_ENTRY.map(m => (
                      <button
                        key={m.label}
                        onClick={() => updateField('moodEntry', m.label)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 min-w-[80px] ${formData.moodEntry === m.label ? `${m.color} bg-slate-800 shadow-[0_0_15px_-5px_currentColor]` : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">Mistakes (Cost Analysis)</label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {MISTAKE_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleMistake(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.mistakes?.includes(tag) ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center mt-3 gap-2">
                    <input
                      type="text"
                      value={newMistake}
                      onChange={(e) => setNewMistake(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMistake()}
                      placeholder="+ Custom Mistake"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-indigo-500 w-40 text-center"
                    />
                    <button onClick={handleAddMistake} disabled={!newMistake.trim()} className="p-1 bg-slate-800 rounded hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                      <Plus size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RISK */}
            {step === 3 && (
              <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">The Hard Deck</h3>
                  <p className="text-slate-400 text-sm">{1}% Max Risk Rule Enforced.</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between mb-2">
                  <label className="text-xs text-slate-500 uppercase font-bold self-center">Capital (₹)</label>
                  <input type="number" value={totalCapital} onChange={(e) => setTotalCapital(e.target.value)} className="bg-transparent text-right text-emerald-400 text-lg font-bold outline-none w-32 border-b border-slate-600 focus:border-indigo-500 font-mono" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Entry</label>
                    <input type="number" value={formData.entryPrice || ''} onChange={e => updateField('entryPrice', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none font-mono" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs text-rose-400 uppercase font-bold mb-1 block">Stop Loss</label>
                    <input type="number" value={formData.stopLoss || ''} onChange={e => updateField('stopLoss', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-rose-900/50 rounded-lg p-3 text-white focus:border-rose-500 outline-none font-mono" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Exit</label>
                    <input type="number" value={formData.exitPrice || ''} onChange={e => updateField('exitPrice', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none font-mono" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Qty</label>
                    <input type="number" value={formData.quantity || ''} onChange={e => updateField('quantity', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none font-mono" placeholder="1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Brokerage & Fees</label>
                    <input type="number" value={formData.fees || ''} onChange={e => updateField('fees', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none font-mono" placeholder="0.00" />
                  </div>
                </div>

                {(riskData.riskAmount > 0) && (
                  <div className={`p-4 rounded-lg border flex flex-col gap-3 ${riskData.isViolation ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-sm font-bold uppercase flex items-center gap-2 ${riskData.isViolation ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {riskData.isViolation ? <ShieldAlert size={18} /> : <Target size={18} />}
                          {riskData.isViolation ? 'VIOLATION DETECTED' : 'APPROVED'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">1R (Risk Unit): <span className="font-mono text-white">₹{riskData.riskAmount.toFixed(2)}</span></p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold font-mono ${riskData.isViolation ? 'text-rose-500' : 'text-slate-200'}`}>{riskData.percentRisk.toFixed(2)}%</div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Of Capital</p>
                      </div>
                    </div>

                    {formData.exitPrice && (
                      <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold uppercase">Realized R-Multiple</span>
                        <span className={`text-xl font-black font-mono ${riskData.rMultiple >= 2 ? 'text-emerald-400' : riskData.rMultiple > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {riskData.rMultiple.toFixed(2)}R
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: EVIDENCE */}
            {step === 4 && (
              <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Evidence Locker</h3>
                  <p className="text-slate-400 text-sm">Advanced Metrics & Screenshots.</p>
                </div>

                <div onClick={() => !isCompressing && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all ${isCompressing ? 'border-slate-700 bg-slate-900' : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500 hover:bg-slate-900'}`}>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : isCompressing ? (
                    <div className="flex flex-col items-center text-indigo-400"><Loader2 className="animate-spin mb-2" size={32} /><span className="text-xs">Compressing...</span></div>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-800 rounded-full mb-4"><Upload className="text-slate-400" size={32} /></div>
                      <p className="text-slate-300 font-medium">Upload Chart</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[10px] text-rose-400 uppercase font-bold mb-1 block">MAE (Max Pain)</label>
                    <input type="number" value={formData.mae || ''} onChange={e => updateField('mae', parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono text-sm" placeholder="Lowest price" />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 uppercase font-bold mb-1 block">MFE (Max Gain)</label>
                    <input type="number" value={formData.mfe || ''} onChange={e => updateField('mfe', parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono text-sm" placeholder="Highest price" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notes</label>
                  <textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none resize-none" placeholder="Trade rationale..." />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-950/80 flex justify-between z-20">
          <button onClick={prevStep} disabled={step === 1} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <ChevronLeft size={18} /> Back
          </button>
          {step < 4 ? (
            <button onClick={nextStep} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={riskData.isViolation || isCompressing} className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${riskData.isViolation ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
              {riskData.isViolation ? <AlertTriangle size={18} /> : <Save size={18} />}
              {riskData.isViolation ? 'Risk Error' : 'Log Trade'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTradeModal;
