// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePortfolio from '../hooks/usePortfolio';
import { Investment, InvestmentType } from '../types';

// Hoist mock data to be accessible in vi.mock
const { mockInvestments } = vi.hoisted(() => {
    return {
        mockInvestments: [
            {
                id: '1',
                name: 'Stock A',
                type: 'Stocks', // Hardcoded string for simplicity in hoisted block to avoid enum import issues
                investedAmount: 1000,
                currentValue: 1200, // +20%
                platform: 'Zerodha',
                lastUpdated: '2023-01-01'
            },
            {
                id: '2',
                name: 'FD B',
                type: 'Fixed Deposit',
                investedAmount: 5000,
                currentValue: 5100, // +2%
                platform: 'Bank',
                lastUpdated: '2023-01-01'
            }
        ] as any[] // Cast to avoid strict type checks inside hoisted block
    };
});

// Setup Mocks
vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: (querier: () => any) => {
        try {
            return querier();
        } catch (e) {
            return [];
        }
    }
}));

vi.mock('../database', () => ({
    db: {
        investments: {
            add: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            toArray: vi.fn().mockReturnValue(mockInvestments),
        },
        life_events: {
            add: vi.fn(),
            delete: vi.fn(),
            toArray: vi.fn().mockReturnValue([]),
        },
        history: {
            toArray: vi.fn().mockReturnValue([]),
        }
    }
}));

import { db } from '../database';

describe('usePortfolio Hook', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default implementations
        (db.investments.toArray as any).mockReturnValue(mockInvestments);
        (db.history.toArray as any).mockReturnValue([]);
        (db.life_events.toArray as any).mockReturnValue([]);
    });

    it('should calculate portfolio stats correctly', () => {
        const { result } = renderHook(() => usePortfolio());

        const stats = result.current.stats;

        expect(stats.totalValue).toBe(6300);
        expect(stats.totalInvested).toBe(6000);
        expect(stats.totalGain).toBe(300);
        expect(stats.totalGainPercent).toBe('5.00');
        expect(stats.topAsset.name).toBe('Stock A');
        expect(Math.round(stats.topAsset.percent)).toBe(20);
    });

    it('should aggregate allocation data correctly', () => {
        const { result } = renderHook(() => usePortfolio());

        const allocation = result.current.allocationData;
        expect(allocation).toHaveLength(2);
        expect(allocation.find(i => i.name === 'Stock A')?.value).toBe(1200);
    });

    it('should aggregate asset class data correctly', () => {
        const { result } = renderHook(() => usePortfolio());

        const classes = result.current.assetClassData;
        expect(classes.find(i => i.name === InvestmentType.STOCKS)?.value).toBe(1200);
    });

    it('should handle empty portfolio', () => {
        // Override mock for this test
        (db.investments.toArray as any).mockReturnValue([]);

        const { result } = renderHook(() => usePortfolio());

        expect(result.current.stats.totalValue).toBe(0);
        expect(result.current.stats.totalInvested).toBe(0);
        expect(result.current.stats.totalGain).toBe(0);
        expect(result.current.stats.totalGainPercent).toBe('0.00');
    });
});
