
export type JarvisActionType = 'NAVIGATE' | 'SPEAK' | 'TOGGLE_THEME' | 'REFRESH_DATA' | 'NONE';

export interface JarvisAction {
    type: JarvisActionType;
    payload?: string;
    response?: string; // What Jarvis says back
}

class JarvisCommandService {

    // Simple improved fuzzy matching could go here, for now regex/includes
    processCommand(transcript: string): JarvisAction {
        const lower = transcript.toLowerCase();

        // --- NAVIGATION ---
        if (lower.includes('dashboard') || lower.includes('home')) {
            return { type: 'NAVIGATE', payload: 'dashboard', response: "Opening Dashboard." };
        }
        if (lower.includes('portfolio') || lower.includes('investments')) {
            return { type: 'NAVIGATE', payload: 'portfolio', response: "Accessing Portfolio." };
        }
        if (lower.includes('market') || lower.includes('insider') || lower.includes('bulk')) {
            return { type: 'NAVIGATE', payload: 'growth', response: "Loading Market Intelligence." }; // Assuming Growth tab
        }
        if (lower.includes('analytics') || lower.includes('spending')) {
            return { type: 'NAVIGATE', payload: 'analytics', response: "Analyzing spending patterns." };
        }
        if (lower.includes('psychology') || lower.includes('mind')) {
            return { type: 'NAVIGATE', payload: 'psychology', response: "Opening Psychology profile." };
        }

        // --- DATA / STATUS ---
        // These would ideally need access to the Store. For now, we return the intent, 
        // and the UI layer (which has store access) will fulfill the data.
        if (lower.includes('net worth') || lower.includes('balance') || lower.includes('status report')) {
            // Special payload to tell UI to lookup value
            return { type: 'SPEAK', payload: 'QUERY_NET_WORTH', response: "Calculating Net Worth..." };
        }

        // --- ACTIONS ---
        if (lower.includes('refresh') || lower.includes('update')) {
            return { type: 'REFRESH_DATA', response: "Refreshing all data streams." };
        }

        if (lower.includes('hello') || lower.includes('hi jarvis')) {
            return { type: 'SPEAK', response: "Online and ready." };
        }

        return { type: 'NONE', response: "" };
    }
}

export const jarvisCommandService = new JarvisCommandService();
