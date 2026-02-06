
import React from 'react';
import { X, Settings, AlertTriangle, Save, RefreshCw, Cpu, Database, Signal, Eye } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import DataBackupSettings from './DataBackupSettings';

interface LogicConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogicConfigModal: React.FC<LogicConfigModalProps> = ({ isOpen, onClose }) => {
    const settings = useSettingsStore();

    if (!isOpen) return null;

    const handleChange = (key: keyof typeof settings, value: string) => {
        // String fields that should NOT be parsed as numbers
        if (key === 'targetDate' || key === 'geminiApiKey' || key === 'groqApiKey') {
            settings.updateSetting(key, value);
            return;
        }
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        settings.updateSetting(key, numValue);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-red-900/50 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

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

                <div className="p-6 overflow-y-auto flex-1">
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

                    <div className="mt-8 border-t border-slate-800 pt-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <Database size={14} /> Data Management
                        </h3>
                        <DataBackupSettings />
                    </div>


                    {/* Section 5: Accessibility */}
                    <div className="mt-6 border-t border-slate-800 pt-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <Eye size={14} /> Accessibility
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <div>
                                <label className="text-sm font-bold text-white">High Contrast Mode</label>
                                <p className="text-xs text-slate-500 mt-1">Maximizes contrast for better readability in bright environments.</p>
                            </div>
                            <button
                                onClick={() => settings.updateSetting('isHighContrast', !settings.isHighContrast)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.isHighContrast ? 'bg-yellow-400' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black shadow-sm transition-transform ${settings.isHighContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Section 0: AI & Cloud Services (Lifetime Access) - Moved to Bottom */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Market Data Feeds */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                                    <Signal size={14} /> Market Data Feeds
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${settings.dataMode === 'LIVE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {settings.dataMode === 'LIVE' ? 'LIVE MODE' : 'OFFLINE'}
                                    </span>
                                    <button
                                        onClick={() => settings.updateSetting('dataMode', settings.dataMode === 'LIVE' ? 'SIMULATION' : 'LIVE')}
                                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${settings.dataMode === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.dataMode === 'LIVE' ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">RapidAPI Key (Indian Stocks)</label>
                                    <input
                                        type="password"
                                        placeholder="Indian Stock Exchange API Key..."
                                        value={settings.apiKeys?.rapidApi || ''}
                                        onChange={(e) => settings.updateSetting('apiKeys', { ...settings.apiKeys, rapidApi: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Alpha Vantage Key (Commodities)</label>
                                    <input
                                        type="password"
                                        placeholder="Free API Key..."
                                        value={settings.apiKeys?.alphaVantage || ''}
                                        onChange={(e) => settings.updateSetting('apiKeys', { ...settings.apiKeys, alphaVantage: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Finnhub Key (Global Indices)</label>
                                    <input
                                        type="password"
                                        placeholder="Free API Key..."
                                        value={settings.apiKeys?.finnhub || ''}
                                        onChange={(e) => settings.updateSetting('apiKeys', { ...settings.apiKeys, finnhub: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">FMP Key (Earnings Calendar)</label>
                                    <input
                                        type="password"
                                        placeholder="Free API Key..."
                                        value={settings.apiKeys?.fmp || ''}
                                        onChange={(e) => settings.updateSetting('apiKeys', { ...settings.apiKeys, fmp: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    All keys are FREE. Get them from <a href="https://rapidapi.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">RapidAPI</a>,
                                    <a href="https://alphavantage.co" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline ml-1">Alpha Vantage</a>,
                                    <a href="https://finnhub.io" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline ml-1">Finnhub</a>,
                                    <a href="https://financialmodelingprep.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline ml-1">FMP</a>
                                </p>
                            </div>
                        </div>

                        {/* AI Config */}
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3 flex items-center gap-2">
                                <Cpu size={14} /> AI Brain Configuration
                            </h3>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Google Gemini API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="AIzaSy... (Leave empty to use shared key)"
                                        value={settings.geminiApiKey}
                                        onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 pl-3 pr-10 focus:border-indigo-500 outline-none font-mono text-sm"
                                    />
                                    {settings.geminiApiKey && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Save size={14} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>.
                                </p>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs text-slate-400 mb-1">Groq API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="gsk_... (For Llama, DeepSeek, Qwen models)"
                                        value={settings.groqApiKey}
                                        onChange={(e) => handleChange('groqApiKey', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 pl-3 pr-10 focus:border-orange-500 outline-none font-mono text-sm"
                                    />
                                    {settings.groqApiKey && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Save size={14} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Get a free key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Groq Console</a>.
                                    Ultra-fast Llama & DeepSeek models.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-red-900/30 bg-red-950/10 flex justify-between items-center shrink-0">
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
