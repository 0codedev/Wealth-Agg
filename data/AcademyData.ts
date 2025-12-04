
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