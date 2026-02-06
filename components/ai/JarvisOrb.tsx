import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Activity, Send, Keyboard } from 'lucide-react';
import { useJarvis } from '../../hooks/useJarvis';

interface JarvisOrbProps {
    onNavigate: (tab: string) => void;
    onSwitchProfile?: (id: string) => void;
}

const JarvisOrb: React.FC<JarvisOrbProps> = ({ onNavigate, onSwitchProfile }) => {
    // Pass handlers object to useJarvis
    const { isListening, isSpeaking, transcript, lastResponse, toggleListening, processText } = useJarvis({
        onNavigate,
        onSwitchProfile
    });

    const [visualizerHeight, setVisualizerHeight] = useState<number[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when shown
    useEffect(() => {
        if (showInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showInput]);

    // Simulate audio visualizer
    useEffect(() => {
        if (isListening || isSpeaking) {
            const interval = setInterval(() => {
                const bars = Array.from({ length: 5 }, () => Math.random() * 20 + 10);
                setVisualizerHeight(bars);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVisualizerHeight([5, 5, 5, 5, 5]);
        }
    }, [isListening, isSpeaking]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            processText(manualInput);
            setManualInput('');
            // Keep input open for follow-up? Or close? Let's keep distinct mode.
            // setShowInput(false); 
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

            {/* Transcript/Response Bubble */}
            {(transcript || lastResponse || showInput) && (
                <div className={`mb-2 w-80 bg-slate-900/95 border border-indigo-500/50 p-4 rounded-2xl rounded-tr-none backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-right-10 fade-in`}>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-indigo-300 font-mono uppercase tracking-widest flex items-center gap-2">
                            {isListening ? <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" /> : <Activity size={12} />}
                            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Jarvis System"}
                        </p>
                        <button
                            onClick={() => setShowInput(!showInput)}
                            className="text-slate-500 hover:text-white transition-colors"
                            title="Toggle Keyboard Input"
                        >
                            <Keyboard size={14} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        {/* Text Display */}
                        {(transcript || lastResponse) && !showInput && (
                            <div className="min-h-[20px]">
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                    {isListening ? `"${transcript}"` : lastResponse}
                                </p>
                            </div>
                        )}

                        {/* Input Form */}
                        {showInput && (
                            <form onSubmit={handleManualSubmit} className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={manualInput}
                                    onChange={e => setManualInput(e.target.value)}
                                    placeholder="Type command (e.g., 'Switch to Mom')..."
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm text-white focus:border-indigo-500 outline-none placeholder:text-slate-600 font-mono"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50"
                                    disabled={!manualInput.trim()}
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* The Orb Button */}
            <button
                onClick={toggleListening}
                className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 shadow-2xl z-50 ${isListening
                    ? 'bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.4)] border border-red-500/50'
                    : isSpeaking
                        ? 'bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-500/50'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                    }`}
            >
                {/* Core Orb Animation */}
                <div className={`absolute inset-0 rounded-full opacity-50 ${isListening ? 'animate-ping bg-red-500' : ''}`}></div>

                {/* Icon */}
                <div className="relative z-10 text-white">
                    {isListening ? (
                        <div className="flex items-end gap-0.5 h-6">
                            {visualizerHeight.map((h, i) => (
                                <div key={i} style={{ height: `${h}px` }} className="w-1 bg-red-400 rounded-full transition-all duration-75"></div>
                            ))}
                        </div>
                    ) : (
                        <Mic size={24} className={`transition-transform ${isSpeaking ? 'scale-110 text-emerald-400' : 'text-indigo-400'}`} />
                    )}
                </div>
            </button>
        </div>
    );
};

export default JarvisOrb;
