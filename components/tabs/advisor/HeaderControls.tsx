import React, { useState } from 'react';
import { Sparkles, ChevronDown, Check, Zap, Star, Shield, TrendingUp, Flame } from 'lucide-react';

// --- Constants ---
import { AIModel, AIPersona } from '../../../types/ai';

export const MODELS: AIModel[] = [
    // Gemini Models (Official API Names - Feb 2026)
    { id: 'gemini-2.5-flash', label: '2.5 Flash', icon: Zap, description: 'Balanced', provider: 'gemini' },
    { id: 'gemini-2.5-flash-lite', label: '2.5 Flash Lite', icon: Zap, description: 'Ultra Fast', provider: 'gemini' },
    { id: 'gemini-3-flash', label: '3.0 Flash', icon: Star, description: 'Latest', provider: 'gemini' },
    // Groq Models (Active - Ultra Fast)
    { id: 'groq:llama-3.3-70b-versatile', label: 'Llama 3.3 70B', icon: Zap, description: 'Groq Power', provider: 'groq' },
    { id: 'groq:llama-3.1-8b-instant', label: 'Llama 3.1 8B', icon: Zap, description: 'Lightning', provider: 'groq' },
    { id: 'groq:meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick', icon: TrendingUp, description: 'Latest Gen', provider: 'groq' },
    // Temporarily Paused Models
    { id: 'groq:deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 (Paused)', icon: Star, description: 'Decommissioned', provider: 'groq', disabled: true },
    { id: 'groq:qwen-qwq-32b', label: 'Qwen QwQ (Paused)', icon: Star, description: 'Decommissioned', provider: 'groq', disabled: true },
    { id: 'groq:compound', label: 'Compound (Paused)', icon: Shield, description: 'Not Available', provider: 'groq', disabled: true },
];

export const PERSONAS: AIPersona[] = [
    { id: 'standard', label: 'Standard Advisor', icon: Shield, prompt: "You are a professional, balanced financial advisor. Focus on risk management and steady growth." },
    { id: 'buffett', label: 'Oracle of Omaha', icon: TrendingUp, prompt: "You are Warren Buffett. Speak in wise, folk-sy aphorisms. Focus on value, moats, and long-term holding. Disdain speculation." },
    { id: 'belfort', label: 'Wolf mode', icon: Zap, prompt: "You are Jordan Belfort (The Wolf of Wall Street). High energy, aggressive sales pitch style. Push for action, but keep it legal. Use phrases like 'Pick up the phone!' or 'Opportunity of a lifetime!'." },
    { id: 'roast', label: 'Roast Master', icon: Flame, prompt: "You are a savage comedian financial auditor. Roast the user's bad decisions mercilessly. accessible but brutal. Make fun of high risk/low reward trades." },
];

// --- Sub Components ---

export const ModelSelector = ({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedModel = MODELS.find(m => m.id === selected) || MODELS[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
            >
                <Sparkles size={14} className="text-indigo-500" />
                <span>{selectedModel.label}</span>
                <ChevronDown size={14} className="opacity-50" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {MODELS.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => { if (!m.disabled) { onSelect(m.id); setIsOpen(false); } }}
                                    disabled={m.disabled}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${m.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                >
                                    <div className={`p-2 rounded-lg ${selected === m.id ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <m.icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{m.label}</p>
                                        <p className="text-[10px] text-slate-400">{m.description}</p>
                                    </div>
                                    {selected === m.id && <Check size={14} className="ml-auto text-indigo-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const PersonaSelector = ({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedPersona = PERSONAS.find(p => p.id === selected) || PERSONAS[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
            >
                <selectedPersona.icon size={14} className="text-fuchsia-500" />
                <span>{selectedPersona.label}</span>
                <ChevronDown size={14} className="opacity-50" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {PERSONAS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => { onSelect(p.id); setIsOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                                <div className={`p-2 rounded-lg ${selected === p.id ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    <p.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{p.label}</p>
                                </div>
                                {selected === p.id && <Check size={14} className="ml-auto text-fuchsia-500" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
