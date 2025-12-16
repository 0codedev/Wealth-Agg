import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';
import { useJarvis } from '../../hooks/useJarvis';

interface JarvisOrbProps {
    onNavigate: (tab: string) => void;
}

const JarvisOrb: React.FC<JarvisOrbProps> = ({ onNavigate }) => {
    const { isListening, isSpeaking, transcript, lastResponse, toggleListening } = useJarvis(onNavigate);
    const [visualizerHeight, setVisualizerHeight] = useState<number[]>([]);

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

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

            {/* Transcript Bubble */}
            {(transcript || lastResponse) && (isListening || isSpeaking || lastResponse) && (
                <div className={`mb-2 max-w-xs bg-slate-900/90 border border-indigo-500/50 p-3 rounded-2xl rounded-tr-none backdrop-blur-md shadow-lg transition-all duration-300 ${isListening ? 'opacity-100' : 'opacity-80'}`}>
                    <p className="text-xs text-indigo-300 font-mono mb-1">
                        {isListening ? "LISTENING..." : isSpeaking ? "JARVIS SPEAKING" : "JARVIS"}
                    </p>
                    <p className="text-sm text-white font-medium">
                        {isListening ? transcript : lastResponse}
                    </p>
                </div>
            )}

            {/* The Orb Button */}
            <button
                onClick={toggleListening}
                className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 shadow-2xl ${isListening
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
