
import React from 'react';
import { X, Settings, AlertTriangle, Save, RefreshCw, Cpu } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

interface LogicConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogicConfigModal: React.FC<LogicConfigModalProps> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore();

  if (!isOpen) return null;

  const handleChange = (key: keyof typeof settings, value: string) => {
      let numValue = parseFloat(value);
      if (key === 'targetDate') {
          settings.updateSetting(key, value);
          return;
      }
      if (isNaN(numValue)) numValue = 0;
      settings.updateSetting(key, numValue);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-red-900/50 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-red-900/30 flex justify-between items-center bg-red-950/10">
           <div className="flex items-center gap-3">
               <div className="p-2 bg-red-900/20 text-red-500 rounded-lg animate-pulse">
                   <Cpu size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                       Logic Core
                   </h2>
                   <p className="text-xs text-red-400 uppercase font-bold tracking-wider">System Configuration</p>
               </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-900/20 rounded-full transition-colors text-red-400">
               <X size={20} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-red-200 leading-relaxed">
                    <strong className="text-red-400">DANGER ZONE:</strong> Modifying these parameters alters the application's financial brain. 
                    Changes affect Risk Calculations, Net Worth projections, and Compliance Rules globally.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Goals */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-2">Targets & Goals</h3>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Project 5L Target (₹)</label>
                        <input 
                            type="number" 
                            value={settings.targetNetWorth}
                            onChange={(e) => handleChange('targetNetWorth', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Target Date</label>
                        <input 
                            type="date" 
                            value={settings.targetDate}
                            onChange={(e) => handleChange('targetDate', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                </div>

                {/* Section 2: Risk Engine */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-2">Risk Engine</h3>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Max Risk Per Trade (%)</label>
                        <input 
                            type="number" 
                            value={settings.riskPerTrade}
                            onChange={(e) => handleChange('riskPerTrade', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Bullion Cap (%)</label>
                        <input 
                            type="number" 
                            value={settings.bullionCap}
                            onChange={(e) => handleChange('bullionCap', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                </div>

                {/* Section 3: Liability */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-2">Liability Manager</h3>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Loan Principal (₹)</label>
                        <input 
                            type="number" 
                            value={settings.loanPrincipal}
                            onChange={(e) => handleChange('loanPrincipal', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Interest Rate (%)</label>
                        <input 
                            type="number" 
                            value={settings.loanInterest}
                            onChange={(e) => handleChange('loanInterest', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                </div>

                {/* Section 4: Rules */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-2">Execution Rules</h3>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Greed Killer ROI (%)</label>
                        <input 
                            type="number" 
                            value={settings.greedKillerRoi}
                            onChange={(e) => handleChange('greedKillerRoi', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">IPO Fresh Issue Limit (%)</label>
                        <input 
                            type="number" 
                            value={settings.ipoFreshIssueThreshold}
                            onChange={(e) => handleChange('ipoFreshIssueThreshold', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-red-500 outline-none font-mono"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-red-900/30 bg-red-950/10 flex justify-between items-center">
            <button 
                onClick={settings.resetDefaults}
                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
            >
                <RefreshCw size={14} /> Reset Defaults
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all"
            >
                <Save size={16} /> Apply Configuration
            </button>
        </div>
      </div>
    </div>
  );
};

export default LogicConfigModal;
