import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { logger } from "./Logger";

// --- API CONFIG ---
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Gets the Gemini API key from localStorage or environment variables.
 * SECURITY: Never hardcode API keys - they get exposed in production bundles.
 * 
 * Priority:
 * 1. localStorage (user-provided via Settings)
 * 2. Environment variable (VITE_GEMINI_API_KEY)
 * 
 * @throws Error if no API key is configured
 */
const getApiKey = (): string => {
    let apiKey: string | null | undefined = null;

    // 1. Try Local Storage (user-provided)
    try {
        apiKey = localStorage.getItem('gemini-api-key');
    } catch (e) {
        logger.warn('AI Service: Unable to access localStorage');
    }

    // 2. Try Environment Variables (Vite)
    if (!apiKey) {
        try {
            // @ts-ignore - Vite injects import.meta.env at build time
            if (typeof import.meta !== 'undefined' && import.meta.env) {
                apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
            }
        } catch (e) {
            logger.warn('AI Service: Unable to access environment variables');
        }
    }

    // 3. No key found - throw helpful error
    if (!apiKey) {
        throw new Error(
            'API_KEY_MISSING: No Gemini API key configured. ' +
            'Please add your key in Settings or set VITE_GEMINI_API_KEY in .env.local'
        );
    }

    return apiKey;
};

// --- ROBUST FETCH HELPER ---
async function generateWithFallback(
    primaryModel: string,
    fallbackModel: string,
    payload: any
): Promise<string> {
    const apiKey = getApiKey();

    const doFetch = async (model: string) => {
        const url = `${API_BASE_URL}/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        // Handle safety blocks or empty responses
        if (!data.candidates || data.candidates.length === 0) {
            if (data.promptFeedback?.blockReason) throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
            throw new Error("No candidates returned");
        }
        return data.candidates[0].content.parts[0].text || "";
    };

    try {
        // logger.debug(`AI Service: Attempting primary model: ${primaryModel}`);
        return await doFetch(primaryModel);
    } catch (error: any) {
        logger.warn(`AI Service: Primary model ${primaryModel} failed. Falling back to ${fallbackModel}.`, error);
        try {
            // logger.debug(`AI Service: Attempting fallback model: ${fallbackModel}`);
            return await doFetch(fallbackModel);
        } catch (fallbackError: any) {
            logger.error(`AI Service: Fallback model ${fallbackModel} also failed.`, fallbackError);
            // Throw the actual error message so the UI can display it
            throw new Error(fallbackError.message || "Unable to process request with selected model.");
        }
    }
}

// --- Audio Helper Functions (Encoding/Decoding) ---
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createPCM16Blob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}

// --- Module F: SEBI Core Persona Definition ---
export const SEBI_COMPLIANCE_CORE = `
    ROLE: You are a SEBI-Compliant Financial Advisor for the "Wealth Aggregator" app.
    CORE DIRECTIVES:
    1. STRICT COMPLIANCE: If the user asks about "Grey Market", "SME IPO Hacks", "Pump and Dump", or "Loophole Strategies", YOU MUST:
       - Cite relevant SEBI Circulars/Regulations.
       - Warn about "Front Running", "RII Limits", or "Market Manipulation".
       - REFUSE to provide illegal workarounds.
    2. DISCOUNT SNIPER:
       - If the user asks "Should I buy?", assess the context.
       - If you have data indicating 'Motilal Midcap' or similar funds have dropped > 5% from recent highs, suggest a "Discount Buy Order".
       - Always clarify that this is a suggestion, not financial advice (Standard Disclaimer).
    3. TONE: Professional, Skeptical, Risk-Averse.
`;

// --- Feature 1: Conversational Voice (Live API) ---
// NOTE: Keeping SDK for Live API as it requires WebSocket complexity.
export class LiveVoiceSession {
    private inputContext: AudioContext | null = null;
    private outputContext: AudioContext | null = null;
    private nextStartTime = 0;
    private sources = new Set<AudioBufferSourceNode>();
    private stream: MediaStream | null = null;

    async start(userContextInstruction: string) {
        // Initialize contexts
        this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        await this.outputContext.resume();

        const outputNode = this.outputContext.createGain();
        outputNode.connect(this.outputContext.destination);

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const fullSystemInstruction = `${SEBI_COMPLIANCE_CORE}\n\nUSER CONTEXT: ${userContextInstruction}`;
        const apiKey = getApiKey();

        // Try to instantiate SDK - if it fails, we can't do Live API
        let ai;
        try {
            ai = new GoogleGenAI({ apiKey });
        } catch (e) {
            logger.error("SDK Init Failed for Live Voice", e);
            throw new Error("Voice features unavailable due to SDK mismatch.");
        }

        const connectSession = async (model: string) => {
            return await ai.live.connect({
                model: model,
                callbacks: {
                    onopen: () => {
                        logger.info(`Gemini Live: Session Connected (${model})`);
                        if (!this.inputContext || !this.stream) return;
                        const source = this.inputContext.createMediaStreamSource(this.stream);
                        const scriptProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createPCM16Blob(inputData);
                            sessionPromise.then(session => {
                                try { session.sendRealtimeInput({ media: pcmBlob }); } catch (err) { }
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(this.inputContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && this.outputContext) {
                            this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
                            try {
                                const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputContext, 24000, 1);
                                const source = this.outputContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);
                                source.addEventListener('ended', () => this.sources.delete(source));
                                source.start(this.nextStartTime);
                                this.nextStartTime += audioBuffer.duration;
                                this.sources.add(source);
                            } catch (decodeErr) { logger.error("Audio decode error:", decodeErr); }
                        }
                    },
                    onclose: () => { this.stop(); },
                    onerror: (err) => { logger.error("Gemini Live: Error", err); this.stop(); }
                },
                config: {
                    systemInstruction: fullSystemInstruction,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
                }
            });
        };

        let sessionPromise;
        try {
            logger.info("Gemini Live: Attempting gemini-2.5-flash...");
            sessionPromise = connectSession('gemini-2.5-flash');
            await sessionPromise;
        } catch (e) {
            logger.warn("Gemini Live: 2.5 failed, falling back to flash-latest", e);
            sessionPromise = connectSession('gemini-flash-latest');
        }

        if (sessionPromise) {
            sessionPromise.catch((err) => {
                logger.error("Gemini Live: Connection failed", err);
                this.stop();
                throw err;
            });
        }
        return sessionPromise;
    }

    stop() {
        if (this.stream) { this.stream.getTracks().forEach(track => track.stop()); this.stream = null; }
        if (this.inputContext) { this.inputContext.close(); this.inputContext = null; }
        if (this.outputContext) { this.outputContext.close(); this.outputContext = null; }
        this.sources.forEach(source => { try { source.stop(); } catch (e) { } });
        this.sources.clear();
    }
}

// --- Feature 2: Search Grounding ---
export const searchWeb = async (query: string) => {
    // logger.debug("AI Service: Searching web for:", query);
    return await generateWithFallback(
        'gemini-2.5-flash',
        'gemini-flash-latest',
        {
            contents: [{ parts: [{ text: query }] }],
            tools: [{ google_search: {} }] // Note: REST API uses google_search (snake_case)
        }
    );
}

// --- Feature 3: General Intelligence (Pro/Flash) ---
export const askGemini = async (prompt: string, usePro: boolean = false) => {
    // logger.debug(`AI Service: Asking Gemini (${usePro ? 'Pro' : 'Flash'}):`, prompt);
    const primary = usePro ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const fallback = usePro ? 'gemini-pro-latest' : 'gemini-flash-latest';
    return await generateWithFallback(primary, fallback, {
        contents: [{ parts: [{ text: prompt }] }]
    });
}

// --- Feature 4: AI Powered Chatbot (Multi-Modal) ---
export interface ChatPart {
    text?: string;
    inlineData?: { mimeType: string; data: string; };
}

export const chatWithGemini = async (
    model: string,
    history: { role: string, parts: ChatPart[] }[],
    message: string | ChatPart[],
    systemInstruction?: string
) => {
    // logger.debug(`AI Service: Chatting... requested model: ${model}`);

    let primary = model;
    let fallback = 'gemini-flash-latest';
    if (model.includes('pro') || model.includes('2.5')) {
        primary = model.replace('1.5', '2.5');
        fallback = model.includes('pro') ? 'gemini-pro-latest' : 'gemini-flash-latest';
    }

    // Format history for REST API
    const contents = history.map(h => ({
        role: h.role,
        parts: h.parts
    }));

    // Add new message
    const newParts = typeof message === 'string' ? [{ text: message }] :
        Array.isArray(message) ? message : [message];
    contents.push({ role: 'user', parts: newParts as any });

    const payload: any = {
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
    };

    return await generateWithFallback(primary, fallback, payload);
}

// --- Feature 5: Analyze Images ---
export const analyzeImage = async (base64Image: string, prompt: string = "Analyze this image") => {
    // logger.debug("AI Service: Analyzing image...");
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    return await generateWithFallback(
        'gemini-2.5-pro',
        'gemini-pro-latest',
        {
            contents: [{
                parts: [
                    { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                    { text: prompt }
                ]
            }]
        }
    );
}

// --- Feature 6: Fast AI Responses ---
export const quickAsk = async (prompt: string) => {
    // logger.debug("AI Service: Quick ask (Flash-Lite):", prompt);
    return await generateWithFallback(
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        { contents: [{ parts: [{ text: prompt }] }] }
    );
}

// --- Feature 7: Thinking Mode ---
export const deepThink = async (prompt: string) => {
    // logger.debug("AI Service: Deep thinking...", prompt);
    const fullPrompt = `${SEBI_COMPLIANCE_CORE}\n\nQUERY: ${prompt}`;
    // Note: Thinking config might not be supported in v1beta REST API yet or requires specific field
    // We'll omit thinkingConfig for safety in REST fallback or pass it if known working
    return await generateWithFallback(
        'gemini-2.5-pro',
        'gemini-pro-latest',
        {
            contents: [{ parts: [{ text: fullPrompt }] }]
        }
    );
}