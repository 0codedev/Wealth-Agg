
import { Book, Video, FileText, AlertTriangle, Brain, Disc, Trophy } from 'lucide-react';

export type ContentType = 'VIDEO' | 'BOOK' | 'ARTICLE' | 'TERM' | 'NORM';

export interface AcademyItem {
    id: string;
    title: string;
    type: ContentType;
    duration?: string; // e.g. "10 min" or "200 pages"
    description: string;
    xpReward: number;
    url?: string; // For external links/videos
    completed?: boolean;
}

export interface AcademyModule {
    id: string;
    title: string;
    description: string;
    icon: any; // Lucide icon
    items: AcademyItem[];
}

export const ACADEMY_CURRICULUM: AcademyModule[] = [
    {
        id: 'module-1',
        title: 'Foundation: Market Structure',
        description: 'Understand the invisible hand moving the markets.',
        icon: Disc,
        items: [
            {
                id: 'vid-101',
                title: 'How the Economic Machine Works',
                type: 'VIDEO',
                duration: '30 min',
                description: 'Ray Dalio\'s masterclass on the economy, debt cycles, and credit.',
                xpReward: 50,
                url: 'https://youtube.com/watch?v=PHe0bXAIuk0'
            },
            {
                id: 'book-101',
                title: 'The Intelligent Investor',
                type: 'BOOK',
                duration: '640 pages',
                description: 'Benjamin Graham\'s definitive book on value investing.',
                xpReward: 200
            },
            {
                id: 'term-101',
                title: 'Market Cap vs. Enterprise Value',
                type: 'TERM',
                description: 'Understanding the true cost of buying a company.',
                xpReward: 20
            }
        ]
    },
    {
        id: 'module-2',
        title: 'Psychology: The Mind Game',
        description: 'Master your emotions to master the charts.',
        icon: Brain,
        items: [
            {
                id: 'psy-201',
                title: 'Trading in the Zone',
                type: 'BOOK',
                duration: '240 pages',
                description: 'Mark Douglas on the psychology of consistency.',
                xpReward: 150
            },
            {
                id: 'fomo-201',
                title: 'The FOMO Trap',
                type: 'ARTICLE',
                duration: '5 min read',
                description: 'Why we chase green candles and how to stop. The neuroscience of "Missing Out".',
                xpReward: 30
            },
            {
                id: 'taboo-201',
                title: 'The Gambler\'s Fallacy',
                type: 'TERM',
                description: 'The incorrect belief that if a particular event occurs more frequently than normal during the past it is less likely to happen in the future.',
                xpReward: 20
            }
        ]
    },
    {
        id: 'module-3',
        title: 'Risk Management: Survival',
        description: 'Defense wins championships.',
        icon: AlertTriangle,
        items: [
            {
                id: 'risk-301',
                title: 'The 1% Rule',
                type: 'ARTICLE',
                duration: '3 min read',
                description: 'Never risk more than 1% of your equity on a single trade.',
                xpReward: 30
            },
            {
                id: 'vid-301',
                title: 'Position Sizing Mathematics',
                type: 'VIDEO',
                duration: '15 min',
                description: 'Calculating lot size based on stop loss distance.',
                xpReward: 50
            },
            {
                id: 'norm-301',
                title: 'Stop Loss non-negotiables',
                type: 'NORM',
                description: 'Professional traders NEVER move a stop loss further away.',
                xpReward: 40
            }
        ]
    },
    {
        id: 'module-4',
        title: 'Advanced Derivatives',
        description: 'Futures, Options, and Greeks.',
        icon: FileText,
        items: [
            {
                id: 'term-401',
                title: 'The Greeks: Delta, Gamma, Theta, Vega',
                type: 'TERM',
                description: 'The four horsemen of options pricing.',
                xpReward: 50
            },
            {
                id: 'vid-401',
                title: 'Implied Volatility (IV) Explained',
                type: 'VIDEO',
                duration: '12 min',
                description: 'Understanding how fear is priced into premiums.',
                xpReward: 40
            },
            {
                id: 'taboo-401',
                title: 'Naked Option Selling',
                type: 'ALERT', // Special type for Taboo/Warning
                duration: 'WARNING',
                description: 'Why selling options without coverage is a path to infinite ruin.',
                xpReward: 100
            }
        ]
    }
] as any;
