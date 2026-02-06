import { logger } from "./Logger";
import { GroqChatMessage, GeminiFormatMessage, StreamingCallbacks } from "../types/ai";

// --- GROQ API CONFIG ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Gets the Groq API key from the Zustand settings store.
 * @throws Error if no API key is configured
 */
const getGroqApiKey = (): string => {
    let apiKey: string | null = null;

    // Try Zustand Settings Store
    try {
        const storeData = localStorage.getItem('wealth-aggregator-logic');
        if (storeData) {
            const parsed = JSON.parse(storeData);
            if (parsed.state?.groqApiKey) {
                apiKey = parsed.state.groqApiKey.trim();
            }
        }
    } catch (e) {
        logger.warn('Groq Service: Unable to read from settings store');
    }

    if (!apiKey) {
        throw new Error(
            'GROQ_API_KEY_MISSING: No Groq API key configured. ' +
            'Please add your key in Settings → AI Brain Configuration.'
        );
    }

    return apiKey;
};

// --- RETRY WITH EXPONENTIAL BACKOFF ---
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = BASE_DELAY_MS
): Promise<T> {
    try {
        return await fn();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Don't retry on auth errors
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
            throw error;
        }

        if (retries > 0) {
            logger.warn(`Groq Service: Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

// --- CHAT INTERFACE ---
// Types now imported from ../types/ai

// Types now imported from ../types/ai

/**
 * Chat with a Groq model using OpenAI-compatible API.
 * 
 * @param model - The Groq model ID (e.g., 'llama-3.3-70b-versatile')
 * @param history - Previous messages in the conversation
 * @param message - The new user message
 * @param systemPrompt - Optional system instruction
 */
export const chatWithGroq = async (
    model: string,
    history: GroqChatMessage[],
    message: string,
    systemPrompt?: string
): Promise<string> => {
    const apiKey = getGroqApiKey();

    // Build messages array
    const messages: GroqChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    // Add history (convert from Gemini format if needed)
    history.forEach(msg => {
        const geminiMsg = msg as unknown as GeminiFormatMessage;
        const msgRole = geminiMsg.role;
        messages.push({
            role: msgRole === 'model' ? 'assistant' : (msgRole === 'user' ? 'user' : 'assistant'),
            content: typeof msg.content === 'string' ? msg.content :
                geminiMsg.parts?.[0]?.text || ''
        });
    });

    // Add new user message
    messages.push({ role: 'user', content: message });

    const doFetch = async () => {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error("No response from Groq model");
        }

        return data.choices[0].message.content || "";
    };

    return await retryWithBackoff(doFetch);
};

/**
 * Quick ask for simple prompts (uses fastest model).
 */
export const quickAskGroq = async (prompt: string): Promise<string> => {
    return await chatWithGroq('llama-3.1-8b-instant', [], prompt);
};

/**
 * Deep reasoning with DeepSeek R1.
 */
export const deepThinkGroq = async (prompt: string): Promise<string> => {
    return await chatWithGroq('deepseek-r1-distill-llama-70b', [], prompt);
};

/**
 * Streaming chat with Groq - yields tokens as they arrive.
 * This provides the premium "typing" effect like ChatGPT.
 * 
 * @param model - The Groq model ID
 * @param history - Previous messages
 * @param message - User message
 * @param systemPrompt - Optional system prompt
 * @param onToken - Callback fired for each token received
 * @param onComplete - Callback fired when streaming is done
 * @param onError - Callback fired on error
 */
export const streamChatWithGroq = async (
    model: string,
    history: GroqChatMessage[],
    message: string,
    systemPrompt: string | undefined,
    onToken: (token: string, fullText: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void
): Promise<void> => {
    try {
        const apiKey = getGroqApiKey();
        logger.debug(`Starting Groq Stream: ${model}`, undefined, 'GroqService');

        // Build messages array
        const messages: GroqChatMessage[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        history.forEach(msg => {
            const geminiMsg = msg as unknown as GeminiFormatMessage;
            const msgRole = geminiMsg.role;
            messages.push({
                role: msgRole === 'model' ? 'assistant' : (msgRole === 'user' ? 'user' : 'assistant'),
                content: typeof msg.content === 'string' ? msg.content :
                    geminiMsg.parts?.[0]?.text || ''
            });
        });

        messages.push({ role: 'user', content: message });

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096,
                stream: true // Enable streaming
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error (${response.status}): ${errText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE format: data: {...}\n\n
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;

                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const delta = json.choices?.[0]?.delta?.content;
                        if (delta) {
                            fullText += delta;
                            onToken(delta, fullText);
                        }
                    } catch (e) {
                        // Ignore parse errors for incomplete chunks
                    }
                }
            }
        }

        logger.debug(`Groq Stream Complete. Length: ${fullText.length}`, undefined, 'GroqService');
        onComplete(fullText);
    } catch (error: unknown) {
        onError(error instanceof Error ? error : new Error(String(error)));
    }
};
