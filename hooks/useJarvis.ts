import { useState, useEffect, useRef, useCallback } from 'react';
import { jarvisCommandService, JarvisAction } from '../services/JarvisCommandService';

// Browser Speech Recognition Types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export const useJarvis = (onNavigate: (tab: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastResponse, setLastResponse] = useState('');

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const retryCountRef = useRef(0); // Track retries for "no-speech"

    const speak = useCallback((text: string) => {
        if (!synthesisRef.current) return;

        // Cancel existing
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a "technological" voice
        const voices = synthesisRef.current.getVoices();
        const techVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft David'));
        if (techVoice) utterance.voice = techVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        synthesisRef.current.speak(utterance);
        setLastResponse(text);
    }, []);

    const processCommand = useCallback((text: string) => {
        console.log("Jarvis Processing:", text);
        const action = jarvisCommandService.processCommand(text);

        if (action.response) {
            speak(action.response);
        }

        if (action.type === 'NAVIGATE' && action.payload) {
            onNavigate(action.payload);
        }

        // Handle other types (REFRESH, QUERY) via callback or extended logic later
    }, [onNavigate, speak]);

    // Initialize Recognition
    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionApi = SpeechRecognition || webkitSpeechRecognition;

        if (SpeechRecognitionApi) {
            const recognition = new SpeechRecognitionApi();
            recognition.continuous = false; // Stop after one sentence for command processing
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const result = event.results[current];
                const transcriptText = result[0].transcript;

                setTranscript(transcriptText);

                // Robustness: Process immediately if "Final" flag is set by browser
                if (result.isFinal) {
                    console.log("Jarvis Heard (Final):", transcriptText);
                    processCommand(transcriptText);
                    setIsListening(false);
                    recognition.stop();
                }
            };

            recognition.onerror = (event: any) => {
                console.warn("Jarvis Speech Error:", event.error);

                // AUTO-RETRY LOGIC
                if (event.error === 'no-speech') {
                    if (retryCountRef.current < 1) {
                        console.log("Jarvis: No speech detected, retrying once...");
                        retryCountRef.current += 1;
                        // Small delay to reset internal state
                        setTimeout(() => {
                            try { recognition.start(); } catch (e) { /* ignore already started */ }
                        }, 100);
                        return; // Don't stop yet
                    } else {
                        setLastResponse("Mic timed out. Please speak closer.");
                    }
                } else if (event.error === 'not-allowed') {
                    setLastResponse("Microphone blocked. Check permissions.");
                }

                setIsListening(false);
            };

            recognition.onend = () => {
                // Only stop state if we are truly done (not mid-retry)
                // However, onend fires even before onerror sometimes.
                // We rely on the start() call in onerror to flip isListening back to true if it went false.
                // But better to manage isListening carefully.
                // For simplicity:
                if (retryCountRef.current >= 1 || !isListening) {
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
        }
    }, [processCommand]); // Dependency added for processCommand inclusion

    // Removed the fragile useEffect that watched !isListening

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            // Reset state
            setTranscript('');
            setLastResponse('');
            retryCountRef.current = 0;
            recognitionRef.current?.start();
        }
    };

    return {
        isListening,
        isSpeaking,
        transcript,
        lastResponse,
        toggleListening,
        speak
    };
};
