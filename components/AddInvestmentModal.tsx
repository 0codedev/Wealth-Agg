import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Upload, Repeat, Calendar, Tag, Globe, Briefcase, Eye, EyeOff } from 'lucide-react';
import { Investment, InvestmentType, RecurringFrequency } from '../types';
import * as AIService from '../services/aiService';
import { useFamily } from '../contexts/FamilyContext';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id'>, id?: string) => void;
  editingInvestment?: Investment | null;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onSave, editingInvestment }) => {
  // Family Profile Context
  const { activeEntity } = useFamily();

  // Basic Info
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>(InvestmentType.MUTUAL_FUND);
  const [platform, setPlatform] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [dateInvested, setDateInvested] = useState(new Date().toISOString().split('T')[0]);

  // Advanced / Metadata
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('India');
  const [tagsInput, setTagsInput] = useState('');

  // Config
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [recurringAmount, setRecurringAmount] = useState('');
  const [isHiddenFromTotals, setIsHiddenFromTotals] = useState(false); // NEW

  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setType(InvestmentType.MUTUAL_FUND);
    setPlatform('');
    setInvestedAmount('');
    setCurrentValue('');
    setDateInvested(new Date().toISOString().split('T')[0]);
    setIsRecurring(false);
    setRecurringFrequency(RecurringFrequency.MONTHLY);
    setRecurringAmount('');
    setSector('');
    setCountry('India');
    setTagsInput('');
    setIsHiddenFromTotals(false);
    setError('');
  };

  useEffect(() => {
    if (editingInvestment) {
      setName(editingInvestment.name);
      setType(editingInvestment.type);
      setPlatform(editingInvestment.platform);
      setInvestedAmount(String(editingInvestment.investedAmount));
      setCurrentValue(String(editingInvestment.currentValue));
      setDateInvested(editingInvestment.lastUpdated.split('T')[0]);
      setSector(editingInvestment.sector || '');
      setCountry(editingInvestment.country || 'India');
      setTagsInput(editingInvestment.tags ? editingInvestment.tags.join(', ') : '');
      setIsHiddenFromTotals(editingInvestment.isHiddenFromTotals || false);

      if (editingInvestment.recurring && editingInvestment.recurring.isEnabled) {
        setIsRecurring(true);
        setRecurringFrequency(editingInvestment.recurring.frequency);
        setRecurringAmount(String(editingInvestment.recurring.amount));
      } else {
        setIsRecurring(false);
        setRecurringFrequency(RecurringFrequency.MONTHLY);
        setRecurringAmount('');
      }
    } else {
      resetForm();
    }
  }, [editingInvestment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !platform || !investedAmount || !currentValue) {
      setError('All fields are required');
      return;
    }

    // Determine owner: if editing, keep existing owner; if adding, use active profile (default to SELF for ALL view)
    const investmentOwner = editingInvestment?.owner || (activeEntity === 'ALL' ? 'SELF' : activeEntity);

    const investmentData: Omit<Investment, 'id'> = {
      name,
      type,
      platform,
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue),
      lastUpdated: new Date(dateInvested).toISOString(),
      sector: sector || undefined,
      country: country || undefined,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      isHiddenFromTotals, // NEW
      owner: investmentOwner as Investment['owner'], // Assign owner based on active profile
      recurring: isRecurring ? {
        isEnabled: true,
        frequency: recurringFrequency,
        amount: parseFloat(recurringAmount) || 0
      } : undefined
    };

    onSave(investmentData, editingInvestment?.id);
    if (!editingInvestment) resetForm();
    onClose();
  };

  const handleFile = async (file: File) => {
    setIsScanning(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // ... (API Logic same as before for brevity) ...
        const prompt = `Analyze this screenshot... Return ONLY JSON.`;
        try {
          const response = await AIService.analyzeImage(base64String, prompt);
          const cleanJson = response.replace(/```json|```/g, '').trim();
          const data = JSON.parse(cleanJson);
          if (data.name) setName(data.name);
          if (data.platform) setPlatform(data.platform);
          if (data.investedAmount) setInvestedAmount(String(data.investedAmount));
          if (data.currentValue) setCurrentValue(String(data.currentValue));
          if (data.date) setDateInvested(data.date);
          if (data.sector) setSector(data.sector);
          if (data.type) {
            const validTypes = Object.values(InvestmentType);
            if (validTypes.includes(data.type)) setType(data.type);
          }
        } catch (err) {
          console.error(err);
          setError("Could not extract data. Please enter manually.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanning(false);
      setError("Error reading file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {editingInvestment ? 'Edit Investment' : 'Add Asset'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Track your diverse portfolio manually or via scan.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Scan & Core Data */}
          <div className="md:col-span-4 space-y-6">
            {/* Scanner Area - Available in both Add and Edit modes now */}
            <div
              className="relative group"
              onPaste={(e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) handleFile(blob);
                  }
                }
              }}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full flex flex-col items-center justify-center gap-3 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {isScanning ? (
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                ) : (
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400">
                    <Camera size={24} />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-300">Scan Screenshot</p>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Click to upload or <span className="font-bold underline">Ctrl+V</span> to paste</p>
                </div>
              </button>
            </div>

            {/* Core Amount Fields - Prominently Displayed */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">Invested Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">Current Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Exclude Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isHiddenFromTotals ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  {isHiddenFromTotals ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Ghost Mode</p>
                  <p className="text-xs text-slate-500">Exclude from Total Net Worth</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isHiddenFromTotals} onChange={(e) => setIsHiddenFromTotals(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Right Column: Detailed Form */}
          <div className="md:col-span-8 flex flex-col justify-between h-full">
            <form id="add-asset-form" onSubmit={handleSubmit} className="space-y-5 h-full overflow-y-auto pr-2 scrollbar-thin">
              {/* Primary Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Asset Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nifty 50 Index Fund" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Platform / Broker</label>
                  <input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Zerodha, CoinDCX" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  <select value={type} onChange={(e) => setType(e.target.value as InvestmentType)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    {Object.values(InvestmentType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Investment</label>
                  <input type="date" value={dateInvested} onChange={(e) => setDateInvested(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Metadata (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group">
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 group-focus-within:text-indigo-500"><Briefcase size={12} /> Sector</label>
                    <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Technology" className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-500 outline-none" />
                  </div>
                  <div className="group">
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 group-focus-within:text-indigo-500"><Globe size={12} /> Country</label>
                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-500 outline-none" />
                  </div>
                  <div className="group">
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 group-focus-within:text-indigo-500"><Tag size={12} /> Tags</label>
                    <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="LongTerm, Risk" className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Recurring Config */}
              <div className={`transition-all duration-300 rounded-xl border ${isRecurring ? 'bg-indigo-50/50 border-indigo-100 dark:bg-slate-800 dark:border-slate-700' : 'bg-transparent border-transparent'}`}>
                <div className="flex items-center justify-between p-2">
                  <div onClick={() => setIsRecurring(!isRecurring)} className="flex items-center gap-2 cursor-pointer select-none">
                    <div className={`p-1.5 rounded-md ${isRecurring ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}><Repeat size={14} /></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Recurring Investment (SIP)</span>
                  </div>
                  {isRecurring && <span className="text-xs font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Active</span>}
                </div>
                {isRecurring && (
                  <div className="p-3 pt-0 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <select value={recurringFrequency} onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                      <option value={RecurringFrequency.MONTHLY}>Monthly</option>
                      <option value={RecurringFrequency.DAILY}>Daily</option>
                    </select>
                    <input type="number" value={recurringAmount} onChange={(e) => setRecurringAmount(e.target.value)} placeholder="Amount" className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>{editingInvestment ? 'Update Asset' : 'Add to Portfolio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-5">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddInvestmentModal;
