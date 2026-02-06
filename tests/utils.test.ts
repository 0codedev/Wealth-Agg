
import { describe, it, expect, vi } from 'vitest';
import { formatCurrency, calculateStreaks, getFiscalYearRange } from '../utils/helpers';

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
            const trades = [
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 10, date: '2024-01-01' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 20, date: '2024-01-02' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 110, quantity: 1, direction: 'LONG', pnl: 30, date: '2024-01-03' } as any,
            ];
            const result = calculateStreaks(trades);
            expect(result.currentWinStreak).toBe(3);
            expect(result.currentLoseStreak).toBe(0);
        });

        it('calculates losing streaks correctly', () => {
            const trades = [
                { symbol: 'A', entryPrice: 100, exitPrice: 90, quantity: 1, direction: 'LONG', pnl: -10, date: '2024-01-01' } as any,
                { symbol: 'A', entryPrice: 100, exitPrice: 90, quantity: 1, direction: 'LONG', pnl: -20, date: '2024-01-02' } as any,
            ];
            const result = calculateStreaks(trades);
            expect(result.currentLoseStreak).toBe(2);
            expect(result.currentWinStreak).toBe(0);
        });

        it('resets streak on mixed results', () => {
            // Newest first order simulated by date? function sorts internally.
            const trades = [
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
            // Mock System Date using vi.useFakeTimers
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-05-15')); // May 2024

            const result = getFiscalYearRange(0);
            expect(result.label).toBe('FY 24-25');
            expect(result.startDate.getMonth()).toBe(3); // April
            expect(result.startDate.getDate()).toBe(1);

            vi.useRealTimers();
        });

        it('handles March correctly (previous FY)', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-03-15')); // March 2024

            const result = getFiscalYearRange(0);
            expect(result.label).toBe('FY 23-24');

            vi.useRealTimers();
        });
    });
});
