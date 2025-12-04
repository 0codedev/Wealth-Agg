
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Upload, Repeat, Calendar } from 'lucide-react';
import { Investment, InvestmentType, RecurringFrequency } from '../types';
import * as AIService from '../services/aiService';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id'>, id?: string) => void;
  editingInvestment?: Investment | null;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onSave, editingInvestment }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>(InvestmentType.MUTUAL_FUND);
  const [platform, setPlatform] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [dateInvested, setDateInvested] = useState(new Date().toISOString().split('T')[0]);
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [recurringAmount, setRecurringAmount] = useState('');

  const [error, setError] = useState('');
  
  // Screenshot Scanning State
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
    setError('');
  };

  // Effect to populate form if editing
  useEffect(() => {
    if (editingInvestment) {
      setName(editingInvestment.name);
      setType(editingInvestment.type);
      setPlatform(editingInvestment.platform);
      setInvestedAmount(String(editingInvestment.investedAmount));
      setCurrentValue(String(editingInvestment.currentValue));
      setDateInvested(editingInvestment.lastUpdated.split('T')[0]);
      
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

    const investmentData: Omit<Investment, 'id'> = {
      name,
      type,
      platform,
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue),
      lastUpdated: new Date(dateInvested).toISOString(),
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError('');

    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            
            const prompt = `
                Analyze this screenshot of an investment app. 
                Extract the following details into a valid JSON object:
                {
                    "name": "Name of the asset or fund",
                    "type": "One of: Mutual Fund, Stocks, Digital Gold, Crypto, ETF, Smallcase",
                    "platform": "Name of the app (e.g. Zerodha, Groww, Jar)",
                    "investedAmount": number (only the value),
                    "currentValue": number (only the value),
                    "date": "YYYY-MM-DD" (if visible, else null)
                }
                If you cannot find a value, make a best guess or leave it 0.
                Return ONLY JSON.
            `;

            try {
                const response = await AIService.analyzeImage(base64String, prompt);
                const cleanJson = response.replace(/```json|```/g, '').trim();
                const data = JSON.parse(cleanJson);

                if (data.name) setName(data.name);
                if (data.platform) setPlatform(data.platform);
                if (data.investedAmount) setInvestedAmount(String(data.investedAmount));
                if (data.currentValue) setCurrentValue(String(data.currentValue));
                if (data.date) setDateInvested(data.date);
                if (data.type) {
                    const validTypes = Object.values(InvestmentType);
                    if (validTypes.includes(data.type)) {
                        setType(data.type);
                    }
                }
            } catch (err) {
                console.error("Scanning failed", err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {editingInvestment ? 'Edit Investment' : 'Add New Asset'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {!editingInvestment && (
            <div className="p-6 pb-0">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 border-dashed p-4 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:bg-slate-750 transition-all group"
                >
                    {isScanning ? (
                        <>
                            <Loader2 size={20} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                            <span className="font-medium">Analyzing Screenshot...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                <Camera size={20} className="dark:text-white" />
                            </div>
                            <div className="text-left">
                                <span className="block font-semibold text-sm dark:text-slate-200">Scan Screenshot</span>
                                <span className="block text-xs text-indigo-400 dark:text-slate-400">Auto-fill from Zerodha, Groww, etc.</span>
                            </div>
                        </>
                    )}
                </button>
                
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
                    </div>
                    <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">Or enter details</span>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className={`p-6 ${!editingInvestment ? 'pt-0' : ''} space-y-4`}>
          {error && (
            <div className="bg-red-50 dark:bg-rose-900/20 text-red-600 dark:text-rose-400 text-sm p-3 rounded-lg border border-red-100 dark:border-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nifty 50 Index Fund"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvestmentType)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
              >
                {Object.values(InvestmentType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform/App</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g., Zerodha"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invested (₹)</label>
              <input
                type="number"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Value (₹)</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Investment Date</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                    type="date"
                    value={dateInvested}
                    onChange={(e) => setDateInvested(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
                />
            </div>
          </div>

          {/* Recurring Investment Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                 <Repeat size={18} className="text-indigo-500" />
                 <span className="text-sm font-semibold text-slate-800 dark:text-white">Recurring / SIP</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
                   <select 
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                   >
                     <option value={RecurringFrequency.MONTHLY}>Monthly (SIP)</option>
                     <option value={RecurringFrequency.DAILY}>Daily</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
                   <input
                    type="number"
                    value={recurringAmount}
                    onChange={(e) => setRecurringAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                   />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50 transition-all active:scale-[0.98]"
            >
              {editingInvestment ? 'Save Changes' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvestmentModal;
