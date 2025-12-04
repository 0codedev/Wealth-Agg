
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const getAI = () => {
  let apiKey: string | null | undefined = null;
  try {
    apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("AI Service: Error retrieving API key", e);
  }

  if (!apiKey) {
    // We throw to trigger the Error Boundary or catch block in UI, ensuring
    // we don't return an invalid client instance.
    throw new Error("API Key missing. Please provide it in settings.");
  }
  return new GoogleGenAI({ apiKey });
};

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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
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
export class LiveVoiceSession {
    private inputContext: AudioContext | null = null;
    private outputContext: AudioContext | null = null;
    private nextStartTime = 0;
    private sources = new Set<AudioBufferSourceNode>();
    private stream: MediaStream | null = null;

    async start(userContextInstruction: string) {
        const ai = getAI();
        // Initialize contexts
        this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        
        // CRITICAL FIX: Resume the output context to allow audio playback in browsers
        await this.outputContext.resume();

        const outputNode = this.outputContext.createGain();
        outputNode.connect(this.outputContext.destination);

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Combine Core Persona with User Context
        const fullSystemInstruction = `${SEBI_COMPLIANCE_CORE}\n\nUSER CONTEXT: ${userContextInstruction}`;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    console.log("Gemini Live: Session Connected");
                    if (!this.inputContext || !this.stream) return;

                    const source = this.inputContext.createMediaStreamSource(this.stream);
                    const scriptProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPCM16Blob(inputData);
                        // Only send if session is resolved to avoid race conditions
                        sessionPromise.then(session => {
                            try {
                                session.sendRealtimeInput({ media: pcmBlob });
                            } catch (err) {
                                // Ignore send errors if session is closing
                            }
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
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                this.outputContext,
                                24000,
                                1
                            );
                            const source = this.outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => this.sources.delete(source));
                            source.start(this.nextStartTime);
                            this.nextStartTime += audioBuffer.duration;
                            this.sources.add(source);
                        } catch (decodeErr) {
                            console.error("Audio decode error:", decodeErr);
                        }
                    }
                },
                onclose: () => {
                    console.log("Gemini Live: Session Closed");
                    this.stop();
                },
                onerror: (err) => {
                    console.error("Gemini Live: Error", err);
                    this.stop();
                }
            },
            config: {
                systemInstruction: fullSystemInstruction,
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                }
            }
        });

        // Handle immediate connection failures (Network Error)
        sessionPromise.catch((err) => {
            console.error("Gemini Live: Connection failed", err);
            this.stop();
            throw err; // Re-throw so UI knows it failed
        });

        return sessionPromise;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.inputContext) {
            this.inputContext.close();
            this.inputContext = null;
        }
        if (this.outputContext) {
            this.outputContext.close();
            this.outputContext = null;
        }
        this.sources.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        this.sources.clear();
    }
}

// --- Feature 2: Search Grounding ---
export const searchWeb = async (query: string) => {
    console.log("AI Service: Searching web for:", query);
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text;
}

// --- Feature 3: General Intelligence (Pro/Flash) ---
export const askGemini = async (prompt: string, usePro: boolean = false) => {
    console.log(`AI Service: Asking Gemini (${usePro ? 'Pro' : 'Flash'}):`, prompt);
    const ai = getAI();
    const model = usePro ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });
    return response.text;
}

// --- Feature 4: AI Powered Chatbot (Multi-Modal) ---
export interface ChatPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export const chatWithGemini = async (
    model: string,
    history: {role: string, parts: ChatPart[]}[],
    message: string | ChatPart[],
    systemInstruction?: string
) => {
    console.log(`AI Service: Chatting with ${model}`);
    const ai = getAI();
    
    // Safety check: ensure history format is clean for SDK
    const sdkHistory = history.map(h => ({
        role: h.role,
        parts: h.parts.map(p => {
             if (p.inlineData) return { inlineData: p.inlineData };
             return { text: p.text || '' };
        })
    }));

    const chat = ai.chats.create({
        model: model,
        history: sdkHistory,
        config: {
            systemInstruction: systemInstruction || SEBI_COMPLIANCE_CORE
        }
    });

    const msgContent = typeof message === 'string' ? { message } : { message: message };
    
    // @ts-ignore - SDK types compatibility
    const response = await chat.sendMessage(msgContent);
    return response.text;
}

// --- Feature 5: Analyze Images ---
export const analyzeImage = async (base64Image: string, prompt: string = "Analyze this image") => {
    console.log("AI Service: Analyzing image...");
    const ai = getAI();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                { text: prompt }
            ]
        }
    });
    return response.text;
}

// --- Feature 6: Fast AI Responses ---
export const quickAsk = async (prompt: string) => {
    console.log("AI Service: Quick ask (Flash-Lite):", prompt);
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt
    });
    return response.text;
}

// --- Feature 7: Thinking Mode ---
export const deepThink = async (prompt: string) => {
    console.log("AI Service: Deep thinking...", prompt);
    const ai = getAI();
    // Inject SEBI Core into deep thinking prompts as well
    const fullPrompt = `${SEBI_COMPLIANCE_CORE}\n\nQUERY: ${prompt}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: fullPrompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
}
