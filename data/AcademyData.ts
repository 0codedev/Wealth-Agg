
export interface AcademyDayContent {
    title: string;
    subtitle: string;
    type: 'THEORY' | 'PRACTICAL' | 'EXAM';
    content: string[]; // List of checkpoints or questions
}

export const ACADEMY_EXTENSION: Record<number, AcademyDayContent> = {
    16: {
        title: "Regulatory Traps: ASM & GSM",
        subtitle: "Why stocks get jailed.",
        type: "THEORY",
        content: [
            "Read: SEBI's ASM (Additional Surveillance Measure) Framework.",
            "Read: GSM (Graded Surveillance Measure) Stages.",
            "Task: Check if any portfolio stock is in ASM Stage 4."
        ]
    },
    17: {
        title: "The Upper Circuit Trap",
        subtitle: "Liquidity Black Holes.",
        type: "THEORY",
        content: [
            "Understand: How Circuit Breakers work (5%, 10%, 20%).",
            "Rule: NEVER place AMOs (After Market Orders) on UC stocks.",
            "Task: Identify one stock stuck in UC for >3 days."
        ]
    },
    18: {
        title: "Settlement Cycles",
        subtitle: "T+1 and your money.",
        type: "THEORY",
        content: [
            "Learn: Why money doesn't hit your bank instantly.",
            "Concept: BTST (Buy Today Sell Tomorrow) Risks.",
            "Task: Review your broker's ledger for 'Unsettled Credits'."
        ]
    },
    19: {
        title: "The Silent Killers",
        subtitle: "Hidden Charges & Taxes.",
        type: "THEORY",
        content: [
            "Calculate: STT (Securities Transaction Tax) impact.",
            "Check: DP Charges (Depository Participant) per sell order.",
            "Audit: Contract Note of your last trade."
        ]
    },
    20: {
        title: " The Final Exam",
        subtitle: "Prove you are ready.",
        type: "EXAM",
        content: [
            "Question: What is the Hard Deck limit?",
            "Question: When does STCG apply?",
            "Question: How many days for T+1 settlement?",
            "Question: Max allocation for Digital Gold?"
        ]
    }
};

export const EXAM_ANSWERS = {
    q1: "2%",
    q2: "12 months", // Less than 12 months actually, but checking for concept
    q3: "1",
    q4: "10%" // Variable, but checking for risk awareness
};

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number; // 0-based
    explanation: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    xpReward: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        question: "What does RSI > 70 typically indicate?",
        options: ["Stock is cheap (Oversold)", "Stock is expensive (Overbought)", "Trend is reversing down immediately", "Volume is drying up"],
        correctIndex: 1,
        explanation: "RSI above 70 is considered 'Overbought', suggesting price may be extended, but it can stay overbought in strong trends.",
        difficulty: 'EASY',
        xpReward: 10
    },
    {
        id: 2,
        question: "If your Stop Loss is 2% and you risk 1% of total capital, what is your position size?",
        options: ["100% of Capital", "50% of Capital", "10% of Capital", "20% of Capital"],
        correctIndex: 1,
        explanation: "Risk (1%) / Stop (2%) = 0.5 or 50% Position Size.",
        difficulty: 'HARD',
        xpReward: 50
    },
    {
        id: 3,
        question: "Which moving average crossover is known as the 'Golden Cross'?",
        options: ["20 DMA crosses above 50 DMA", "50 DMA crosses above 200 DMA", "50 DMA crosses below 200 DMA", "9 EMA crosses 21 EMA"],
        correctIndex: 1,
        explanation: "A Golden Cross occurs when a short-term moving average (50) crosses above a major long-term moving average (200).",
        difficulty: 'MEDIUM',
        xpReward: 30
    },
    {
        id: 4,
        question: "What is the primary purpose of a 'Hedge'?",
        options: ["To maximize profits", "To double the risk", "To reduce potential losses/volatility", "To avoid paying taxes"],
        correctIndex: 2,
        explanation: "Hedging is like insurance; you pay a cost to protect against adverse price movements.",
        difficulty: 'EASY',
        xpReward: 10
    },
    {
        id: 5,
        question: "In a 'Bull Flag' pattern, the breakout is expected to be in which direction?",
        options: ["Upwards (Continuation)", "Downwards (Reversal)", "Sideways forever", "It is random"],
        correctIndex: 0,
        explanation: "A Bull Flag is a continuation pattern. After a sharp rise (pole), consolidation (flag) usually resolves upwards.",
        difficulty: 'MEDIUM',
        xpReward: 20
    },
    {
        id: 6,
        question: "What does 'Beta' measure in a stock?",
        options: ["Dividend Yield", "Volatility relative to the market", "Debt to Equity Ratio", "Promoter Holding"],
        correctIndex: 1,
        explanation: "Beta measures volatility. Beta > 1 means the stock moves more than the market; Beta < 1 means less.",
        difficulty: 'MEDIUM',
        xpReward: 20
    },
    {
        id: 7,
        question: "Which of these is a bearish candlestick pattern?",
        options: ["Hammer", "Morning Star", "Shooting Star", "Bullish Engulfing"],
        correctIndex: 2,
        explanation: "A Shooting Star has a long upper wick, indicating buyers pushed up but sellers took control by close. Bearish reversal.",
        difficulty: 'EASY',
        xpReward: 10
    },
    {
        id: 8,
        question: "STCG (Short Term Capital Gains) tax rate in India (Equity) as of 2024?",
        options: ["10%", "15%", "20%", "30%"],
        correctIndex: 2,
        explanation: "Post Budget 2024, STCG on equity was increased to 20%.",
        difficulty: 'HARD',
        xpReward: 40
    },
    {
        id: 9,
        question: "What is 'Theta' in Options Trading?",
        options: ["Rate of change of Price", "Time Decay", "Volatility Sensitivity", "Interest Rate sensitivity"],
        correctIndex: 1,
        explanation: "Theta represents time decay. It eats away the value of an option as expiration approaches.",
        difficulty: 'MEDIUM',
        xpReward: 30
    },
    {
        id: 10,
        question: "Which specific rule helps prevent 'Revenge Trading'?",
        options: ["The 200 EMA Rule", "The Hard Deck (Max Daily Loss Limit)", "Buying the Dip", "Using Leverage"],
        correctIndex: 1,
        explanation: "A 'Hard Deck' or Max Daily Loss limit forces you to stop trading before emotions (revenge) take over.",
        difficulty: 'HARD',
        xpReward: 50
    }
];