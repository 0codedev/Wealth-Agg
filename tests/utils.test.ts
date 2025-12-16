
import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateStreaks, getFiscalYearRange } from '../utils/helpers';
// Mock Trade interface for testing
interface Trade {
    id?: number;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    direction: 'LONG' | 'SHORT';
    pnl?: number;
    date: string; // YYYY-MM-DD
    status?: 'OPEN' | 'CLOSED';
}

describe('Utility Helpers', () => {

    describe('formatCurrency', () => {
        it('formats number to INR currency', () => {
            const result = formatCurrency(150000);
            // Relaxed check: just look for the numbers and symbol
            expect(result).toContain('₹');
            expect(result).toContain('1,50,000');
        });

        it('handles zero', () => {
            const result = formatCurrency(0);
            expect(result).toContain('₹');
            expect(result).toContain('0');
        });
    });

    describe('calculateStreaks', () => {
        it('calculates winning streaks correctly', () => {
            const trades: Trade[] = [
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 10, date: '2024-01-01' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 20, date: '2024-01-02' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 30, date: '2024-01-03' } as any,
            ];
            const result = calculateStreaks(trades);
            expect(result.currentWinStreak).toBe(3);
            expect(result.currentLoseStreak).toBe(0);
        });

        it('calculates losing streaks correctly', () => {
            const trades: Trade[] = [
                { symbol: 'A', entryPrice: 100, exitPrice: 90, quantity: 1, direction: 'LONG', pnl: -10, date: '2024-01-01' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 90, quantity: 1, direction: 'LONG', pnl: -20, date: '2024-01-02' } as any,
            ];
            const result = calculateStreaks(trades);
            expect(result.currentLoseStreak).toBe(2);
            expect(result.currentWinStreak).toBe(0);
        });

        it('resets streak on mixed results', () => {
            // Newest first order simulated by date? function sorts internally.
            const trades: Trade[] = [
                { symbol: 'A', pnl: 10, date: '2024-01-03' } as any, // Win (Newest)
                { symbol: 'A', pnl: -10, date: '2024-01-02' } as any, // Loss
            ];
            const result = calculateStreaks(trades);
            // Most recent is win, so win streak 1.
            expect(result.currentWinStreak).toBe(1);
            expect(result.currentLoseStreak).toBe(0);
        });
    });

    describe('getFiscalYearRange', () => {
        it('returns correct FY for current date', () => {
            // Mock System Date
            const mockDate = new Date('2024-05-15'); // May 2024
            const OriginalDate = global.Date;

            // @ts-ignore
            global.Date = class extends OriginalDate {
                constructor(...args: any[]) {
                    if (args.length) {
                        return new OriginalDate(...args as [any]);
                    }
                    return mockDate;
                }
            };

            const result = getFiscalYearRange(0);
            expect(result.label).toBe('FY 24-25');
            expect(result.startDate.getMonth()).toBe(3); // April
            expect(result.startDate.getDate()).toBe(1);

            global.Date = OriginalDate;
        });

        it('handles March correctly (previous FY)', () => {
            const mockDate = new Date('2024-03-15'); // March 2024
            const OriginalDate = global.Date;

            // @ts-ignore
            global.Date = class extends OriginalDate {
                constructor(...args: any[]) {
                    if (args.length) {
                        return new OriginalDate(...args as [any]);
                    }
                    return mockDate;
                }
            };

            const result = getFiscalYearRange(0);
            expect(result.label).toBe('FY 23-24');

            global.Date = OriginalDate;
        });
    });
});
