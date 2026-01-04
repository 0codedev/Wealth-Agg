
export type JarvisActionType =
    | 'NAVIGATE'
    | 'SPEAK'
    | 'TOGGLE_THEME'
    | 'TOGGLE_PRIVACY'
    | 'REFRESH_DATA'
    | 'OPEN_MODAL'
    | 'QUERY_DATA'
    | 'NONE';

export interface JarvisAction {
    type: JarvisActionType;
    payload?: string;
    response?: string; // What Jarvis says back
}

// Fuzzy match helper - checks if words match with some flexibility
const fuzzyMatch = (input: string, targets: string[]): boolean => {
    const words = input.toLowerCase().split(/\s+/);
    return targets.some(target => {
        const targetWords = target.toLowerCase().split(/\s+/);
        return targetWords.every(tw =>
            words.some(w => w.includes(tw) || tw.includes(w) || levenshteinDistance(w, tw) <= 2)
        );
    });
};

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
};

class JarvisCommandService {

    processCommand(transcript: string): JarvisAction {
        const lower = transcript.toLowerCase().trim();

        // ==================== NAVIGATION COMMANDS ====================

        // Dashboard
        if (fuzzyMatch(lower, ['dashboard', 'home', 'main screen', 'overview'])) {
            return { type: 'NAVIGATE', payload: 'dashboard', response: "Opening Dashboard." };
        }

        // Portfolio
        if (fuzzyMatch(lower, ['portfolio', 'investments', 'holdings', 'my stocks', 'my assets'])) {
            return { type: 'NAVIGATE', payload: 'portfolio', response: "Accessing Portfolio." };
        }

        // Market Intel
        if (fuzzyMatch(lower, ['market', 'market intel', 'macro pulse', 'sector rotation'])) {
            return { type: 'NAVIGATE', payload: 'market', response: "Loading Market Intelligence." };
        }

        // IPO
        if (fuzzyMatch(lower, ['ipo', 'ipo war room', 'initial public offering', 'new listings'])) {
            return { type: 'NAVIGATE', payload: 'ipo', response: "Opening IPO War Room." };
        }

        // Trading Journal
        if (fuzzyMatch(lower, ['journal', 'trading journal', 'trade log', 'trades', 'psychology'])) {
            return { type: 'NAVIGATE', payload: 'journal', response: "Opening Trading Journal." };
        }

        // Growth Engine
        if (fuzzyMatch(lower, ['growth', 'alpha predator', 'insider', 'bulk deals'])) {
            return { type: 'NAVIGATE', payload: 'growth', response: "Loading Growth Engine." };
        }

        // Life Planner
        if (fuzzyMatch(lower, ['life planner', 'retirement', 'legacy', 'planning'])) {
            return { type: 'NAVIGATE', payload: 'planning', response: "Opening Life Planner." };
        }

        // Goal GPS
        if (fuzzyMatch(lower, ['goals', 'goal gps', 'financial goals', 'target'])) {
            return { type: 'NAVIGATE', payload: 'gps', response: "Opening Goal GPS." };
        }

        // Settings
        if (fuzzyMatch(lower, ['settings', 'preferences', 'configuration'])) {
            return { type: 'NAVIGATE', payload: 'settings', response: "Opening Settings." };
        }

        // ==================== DATA QUERY COMMANDS ====================

        // Net Worth
        if (fuzzyMatch(lower, ['net worth', 'total value', 'how much do i have', 'balance', 'status report'])) {
            return { type: 'QUERY_DATA', payload: 'NET_WORTH', response: "Calculating your net worth..." };
        }

        // XIRR
        if (fuzzyMatch(lower, ['xirr', 'returns', 'performance', 'how am i doing'])) {
            return { type: 'QUERY_DATA', payload: 'XIRR', response: "Fetching your XIRR..." };
        }

        // Top Performer
        if (fuzzyMatch(lower, ['top performer', 'best stock', 'best investment', 'highest gainer'])) {
            return { type: 'QUERY_DATA', payload: 'TOP_PERFORMER', response: "Finding your top performer..." };
        }

        // Worst Performer
        if (fuzzyMatch(lower, ['worst performer', 'biggest loser', 'worst stock', 'lowest'])) {
            return { type: 'QUERY_DATA', payload: 'WORST_PERFORMER', response: "Finding your worst performer..." };
        }

        // Dividend
        if (fuzzyMatch(lower, ['dividends', 'dividend income', 'passive income'])) {
            return { type: 'QUERY_DATA', payload: 'DIVIDENDS', response: "Calculating dividend income..." };
        }

        // ==================== ACTION COMMANDS ====================

        // Add Investment
        if (fuzzyMatch(lower, ['add investment', 'add stock', 'add asset', 'new investment', 'buy'])) {
            return { type: 'OPEN_MODAL', payload: 'ADD_INVESTMENT', response: "Opening Add Investment form." };
        }

        // Add SIP
        if (fuzzyMatch(lower, ['add sip', 'new sip', 'start sip', 'systematic investment'])) {
            return { type: 'OPEN_MODAL', payload: 'ADD_SIP', response: "Let's set up a new SIP." };
        }

        // Refresh
        if (fuzzyMatch(lower, ['refresh', 'update', 'sync', 'reload data'])) {
            return { type: 'REFRESH_DATA', response: "Refreshing all data streams." };
        }

        // Toggle Privacy
        if (fuzzyMatch(lower, ['privacy mode', 'hide numbers', 'show numbers', 'toggle privacy'])) {
            return { type: 'TOGGLE_PRIVACY', response: "Toggling privacy mode." };
        }

        // Toggle Theme
        if (fuzzyMatch(lower, ['dark mode', 'light mode', 'toggle theme', 'change theme'])) {
            return { type: 'TOGGLE_THEME', response: "Switching theme." };
        }

        // Export
        if (fuzzyMatch(lower, ['export', 'download data', 'backup', 'save data'])) {
            return { type: 'OPEN_MODAL', payload: 'EXPORT', response: "Opening export options." };
        }

        // ==================== CONVERSATIONAL COMMANDS ====================

        // Greeting
        if (fuzzyMatch(lower, ['hello', 'hi jarvis', 'hey jarvis', 'good morning', 'good evening'])) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            return { type: 'SPEAK', response: `${greeting}! Online and ready to assist.` };
        }

        // Status
        if (fuzzyMatch(lower, ['status', 'are you there', 'jarvis'])) {
            return { type: 'SPEAK', response: "Online and monitoring your portfolio." };
        }

        // Help
        if (fuzzyMatch(lower, ['help', 'what can you do', 'commands'])) {
            return {
                type: 'SPEAK',
                response: "I can navigate to any section, show your net worth, XIRR, top performers, add investments, toggle privacy mode, and more. Just ask!"
            };
        }

        // Thank you
        if (fuzzyMatch(lower, ['thank you', 'thanks jarvis', 'great job'])) {
            return { type: 'SPEAK', response: "You're welcome! Happy to help." };
        }

        // ==================== FALLBACK ====================
        return { type: 'NONE', response: "I didn't understand that. Try saying 'help' for available commands." };
    }
}

export const jarvisCommandService = new JarvisCommandService();
