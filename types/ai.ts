export interface ChatPart {
    text?: string;
    inlineData?: { mimeType: string; data: string; };
}

export interface GeminiFormatMessage {
    role: string;
    parts: ChatPart[];
}

export interface GroqChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

export type AIProvider = 'gemini' | 'groq';

export interface AIModel {
    id: string;
    label: string;
    icon: any; // Lucide icon
    description: string;
    provider: AIProvider;
    disabled?: boolean;
}

export interface AIPersona {
    id: string;
    label: string;
    icon: any;
    prompt: string;
}

export interface StreamingCallbacks {
    onToken: (token: string, fullText: string) => void;
    onComplete: (fullText: string) => void;
    onError: (error: Error) => void;
}
