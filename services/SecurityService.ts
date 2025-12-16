/**
 * SecurityService - Encryption, Audit Trail, UPI Tracking, Credit Card Optimizer
 * Covers: E2E encryption, activity logging, expense tracking
 */

// ==================== AUDIT TRAIL ====================

export type AuditAction =
    | 'login'
    | 'logout'
    | 'view_portfolio'
    | 'add_investment'
    | 'edit_investment'
    | 'delete_investment'
    | 'export_data'
    | 'import_data'
    | 'backup_created'
    | 'backup_restored'
    | 'settings_changed'
    | 'alert_created'
    | 'alert_triggered';

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: AuditAction;
    details: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

class AuditTrailService {
    private entries: AuditEntry[] = [];
    private maxEntries = 1000;
    private storageKey = 'wealth_aggregator_audit';

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.entries = JSON.parse(stored);
            }
        } catch {
            this.entries = [];
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
        } catch {
            // Storage full, remove old entries
            this.entries = this.entries.slice(-500);
            localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
        }
    }

    /**
     * Log an action
     */
    log(action: AuditAction, details: string, metadata?: Record<string, any>): void {
        const entry: AuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
            action,
            details,
            metadata,
            userAgent: navigator.userAgent
        };

        this.entries.push(entry);

        // Trim old entries
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }

        this.saveToStorage();
    }

    /**
     * Get all entries
     */
    getAll(): AuditEntry[] {
        return [...this.entries].reverse();
    }

    /**
     * Get entries by action type
     */
    getByAction(action: AuditAction): AuditEntry[] {
        return this.entries.filter(e => e.action === action).reverse();
    }

    /**
     * Get entries in date range
     */
    getByDateRange(startDate: Date, endDate: Date): AuditEntry[] {
        return this.entries.filter(e => {
            const date = new Date(e.timestamp);
            return date >= startDate && date <= endDate;
        }).reverse();
    }

    /**
     * Clear audit trail
     */
    clear(): void {
        this.entries = [];
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Export audit trail
     */
    export(): string {
        return JSON.stringify(this.entries, null, 2);
    }
}

export const auditTrail = new AuditTrailService();

// ==================== UPI TRANSACTION TRACKER ====================

export interface UPITransaction {
    id: string;
    date: string;
    time: string;
    upiId: string;
    merchantName: string;
    amount: number;
    type: 'sent' | 'received';
    category?: string;
    tags?: string[];
    note?: string;
}

export interface UPIAnalytics {
    totalSpent: number;
    totalReceived: number;
    transactionCount: number;
    avgTransactionSize: number;
    topMerchants: Array<{ name: string; amount: number; count: number }>;
    byCategory: Record<string, number>;
    byDayOfWeek: Record<string, number>;
    spendingTrend: Array<{ date: string; amount: number }>;
}

// UPI merchant patterns for categorization
const UPI_CATEGORIES: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /swiggy|zomato|dominos|mcdonalds|kfc|pizza/i, category: 'Food Delivery' },
    { pattern: /amazon|flipkart|myntra|ajio|meesho/i, category: 'Shopping' },
    { pattern: /uber|ola|rapido|metro|irctc/i, category: 'Transport' },
    { pattern: /netflix|hotstar|prime|spotify|youtube/i, category: 'Entertainment' },
    { pattern: /paytm|phonepe|gpay/i, category: 'Wallet' },
    { pattern: /jio|airtel|vodafone|bsnl/i, category: 'Mobile Recharge' },
    { pattern: /electricity|water|gas|bescom|torrent/i, category: 'Utilities' },
    { pattern: /zerodha|groww|upstox|coin|mf/i, category: 'Investments' },
    { pattern: /hospital|pharmacy|apollo|medplus/i, category: 'Healthcare' },
    { pattern: /dmart|bigbasket|blinkit|instamart/i, category: 'Groceries' },
];

export function categorizeUPITransaction(merchantName: string): string {
    for (const { pattern, category } of UPI_CATEGORIES) {
        if (pattern.test(merchantName)) {
            return category;
        }
    }
    return 'Other';
}

export function analyzeUPITransactions(transactions: UPITransaction[]): UPIAnalytics {
    const sent = transactions.filter(t => t.type === 'sent');
    const received = transactions.filter(t => t.type === 'received');

    const totalSpent = sent.reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = received.reduce((sum, t) => sum + t.amount, 0);

    // Top merchants
    const merchantMap: Record<string, { amount: number; count: number }> = {};
    sent.forEach(t => {
        if (!merchantMap[t.merchantName]) {
            merchantMap[t.merchantName] = { amount: 0, count: 0 };
        }
        merchantMap[t.merchantName].amount += t.amount;
        merchantMap[t.merchantName].count++;
    });

    const topMerchants = Object.entries(merchantMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    // By category
    const byCategory: Record<string, number> = {};
    sent.forEach(t => {
        const category = t.category || categorizeUPITransaction(t.merchantName);
        byCategory[category] = (byCategory[category] || 0) + t.amount;
    });

    // By day of week
    const byDayOfWeek: Record<string, number> = {
        'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
    };
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    sent.forEach(t => {
        const day = days[new Date(t.date).getDay()];
        byDayOfWeek[day] += t.amount;
    });

    // Spending trend (last 30 days)
    const spendingTrend: Array<{ date: string; amount: number }> = [];
    const dateMap: Record<string, number> = {};
    sent.forEach(t => {
        dateMap[t.date] = (dateMap[t.date] || 0) + t.amount;
    });
    Object.entries(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30)
        .forEach(([date, amount]) => spendingTrend.push({ date, amount }));

    return {
        totalSpent,
        totalReceived,
        transactionCount: transactions.length,
        avgTransactionSize: sent.length > 0 ? totalSpent / sent.length : 0,
        topMerchants,
        byCategory,
        byDayOfWeek,
        spendingTrend
    };
}

// ==================== CREDIT CARD OPTIMIZER ====================

export interface CreditCard {
    id: string;
    name: string;
    bank: string;
    network: 'Visa' | 'Mastercard' | 'Rupay' | 'Amex';
    annualFee: number;
    rewards: Array<{
        category: string;
        rewardRate: number; // Percentage cashback/points
        limit?: number;
    }>;
    benefits: string[];
}

export const POPULAR_CARDS: CreditCard[] = [
    {
        id: 'hdfc-infinia',
        name: 'HDFC Infinia',
        bank: 'HDFC',
        network: 'Visa',
        annualFee: 12500,
        rewards: [
            { category: 'All', rewardRate: 3.3 },
            { category: 'Travel', rewardRate: 5 }
        ],
        benefits: ['Airport lounge', 'Golf privileges', 'Concierge']
    },
    {
        id: 'amex-mrcc',
        name: 'Amex Membership Rewards',
        bank: 'Amex',
        network: 'Amex',
        annualFee: 4500,
        rewards: [
            { category: 'All', rewardRate: 2 },
            { category: 'Amazon/Flipkart', rewardRate: 5 }
        ],
        benefits: ['Milestone bonuses', 'Travel insurance']
    },
    {
        id: 'axis-magnus',
        name: 'Axis Magnus',
        bank: 'Axis',
        network: 'Visa',
        annualFee: 12500,
        rewards: [
            { category: 'All', rewardRate: 2.5 },
            { category: 'Travel', rewardRate: 5 }
        ],
        benefits: ['Airport lounge', 'Golf', 'Movie tickets']
    },
    {
        id: 'sbi-elite',
        name: 'SBI Elite',
        bank: 'SBI',
        network: 'Mastercard',
        annualFee: 4999,
        rewards: [
            { category: 'All', rewardRate: 2 },
            { category: 'Dining', rewardRate: 5 }
        ],
        benefits: ['Movie tickets', 'Lounge access']
    }
];

export interface CardRecommendation {
    card: CreditCard;
    estimatedRewards: number;
    bestFor: string[];
    score: number;
}

export function recommendBestCard(
    monthlySpend: Record<string, number>,
    userCards: CreditCard[]
): CardRecommendation[] {
    const recommendations: CardRecommendation[] = [];

    userCards.forEach(card => {
        let totalRewards = 0;
        const bestFor: string[] = [];

        Object.entries(monthlySpend).forEach(([category, amount]) => {
            const reward = card.rewards.find(r =>
                r.category.toLowerCase() === category.toLowerCase() ||
                r.category === 'All'
            );

            if (reward) {
                const rewardAmount = (amount * reward.rewardRate) / 100;
                totalRewards += rewardAmount;

                if (reward.rewardRate >= 3) {
                    bestFor.push(category);
                }
            }
        });

        // Account for annual fee
        const netRewards = (totalRewards * 12) - card.annualFee;
        const score = netRewards > 0 ? (netRewards / (totalRewards * 12)) * 100 : 0;

        recommendations.push({
            card,
            estimatedRewards: totalRewards,
            bestFor,
            score
        });
    });

    return recommendations.sort((a, b) => b.estimatedRewards - a.estimatedRewards);
}

// ==================== SIMPLE ENCRYPTION ====================

/**
 * Simple XOR encryption (for demo - use proper crypto in production)
 */
export function encrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

export function decrypt(encrypted: string, key: string): string {
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

/**
 * Generate encryption key from password
 */
export async function deriveKey(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export default {
    auditTrail,
    categorizeUPITransaction,
    analyzeUPITransactions,
    POPULAR_CARDS,
    recommendBestCard,
    encrypt,
    decrypt,
    deriveKey
};
