import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LifeEvent } from '../database';
import { Investment, AggregatedData, InvestmentType } from '../types';

export interface PortfolioStats {
    totalValue: number;
    totalCurrent: number;
    totalInvested: number;
    totalAssets: number;
    totalGain: number;
    totalPL: number;
    totalGainPercent: string;
    totalPLPercent: string;
    dayChange: number;
    dayChangePercent: number;
    diversityScore: number;
    topAsset: { name: string; percent: number };
}

export function usePortfolio() {
    const investments = useLiveQuery(() => db.investments.toArray(), []) || [];
    const history = useLiveQuery(() => db.history.toArray(), []) || [];
    const lifeEvents = useLiveQuery(() => db.life_events.toArray(), []) || [];
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (investments !== undefined) {
            setIsLoading(false);
        }
    }, [investments]);

    // Calculate stats
    const stats: PortfolioStats = useMemo(() => {
        // Filter out hidden assets for calculations
        const activeInvestments = investments.filter(inv => !inv.isHiddenFromTotals);

        const totalValue = activeInvestments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
        const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
        const totalGain = totalValue - totalInvested;
        const totalGainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : '0.00';

        // Diversity score based on unique asset types
        const uniqueTypes = new Set(activeInvestments.map(i => i.type));
        const diversityScore = Math.min(100, uniqueTypes.size * 15);

        // Find top performing asset
        let topAsset = { name: 'None', percent: 0 };
        if (activeInvestments.length > 0) {
            const sortedByGain = [...activeInvestments].sort((a, b) => {
                const gainA = ((a.currentValue || 0) - (a.investedAmount || 0)) / (a.investedAmount || 1) * 100;
                const gainB = ((b.currentValue || 0) - (b.investedAmount || 0)) / (b.investedAmount || 1) * 100;
                return gainB - gainA;
            });
            const top = sortedByGain[0];
            const topGain = ((top.currentValue || 0) - (top.investedAmount || 0)) / (top.investedAmount || 1) * 100;
            topAsset = { name: top.name, percent: topGain };
        }

        return {
            totalValue,
            totalCurrent: totalValue,
            totalInvested,
            totalAssets: totalValue,
            totalGain,
            totalPL: totalGain,
            totalGainPercent,
            totalPLPercent: totalGainPercent,
            dayChange: 0,
            dayChangePercent: 0,
            diversityScore,
            topAsset
        };
    }, [investments]);

    // Aggregated data by type
    const allocationData: AggregatedData[] = useMemo(() => {
        const map = new Map<string, number>();
        investments.filter(inv => !inv.isHiddenFromTotals).forEach(inv => {
            const current = map.get(inv.name) || 0;
            map.set(inv.name, current + (inv.currentValue || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [investments]);

    const assetClassData: AggregatedData[] = useMemo(() => {
        const map = new Map<string, number>();
        investments.filter(inv => !inv.isHiddenFromTotals).forEach(inv => {
            const current = map.get(inv.type) || 0;
            map.set(inv.type, current + (inv.currentValue || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [investments]);

    const platformData: AggregatedData[] = useMemo(() => {
        const map = new Map<string, number>();
        investments.filter(inv => !inv.isHiddenFromTotals).forEach(inv => {
            const platform = inv.platform || 'Unknown';
            const current = map.get(platform) || 0;
            map.set(platform, current + (inv.currentValue || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [investments]);

    // Projection data (simple linear projection)
    const projectionData = useMemo(() => {
        const currentValue = stats.totalValue;
        const monthlyGrowth = 0.01; // 1% assumed monthly growth
        return Array.from({ length: 12 }, (_, i) => ({
            month: `M${i + 1}`,
            value: Math.round(currentValue * Math.pow(1 + monthlyGrowth, i + 1))
        }));
    }, [stats.totalValue]);

    // CRUD Operations
    const addInvestment = useCallback(async (investment: Investment) => {
        await db.investments.add(investment);
    }, []);

    const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
        await db.investments.update(id, updates);
    }, []);

    const deleteInvestment = useCallback(async (id: string) => {
        await db.investments.delete(id);
    }, []);

    const addLifeEvent = useCallback(async (event: Omit<LifeEvent, 'id'>) => {
        await db.life_events.add(event as LifeEvent);
    }, []);

    const deleteLifeEvent = useCallback(async (id: number) => {
        await db.life_events.delete(id);
    }, []);

    const refreshRecurringInvestments = useCallback(async () => {
        // Placeholder for recurring investment logic
        console.log('[usePortfolio] Refreshing recurring investments');
    }, []);

    const refreshData = useCallback(async () => {
        // Force re-query
        console.log('[usePortfolio] Refreshing data');
    }, []);

    return {
        investments,
        stats,
        allocationData,
        assetClassData,
        platformData,
        projectionData,
        history,
        lifeEvents,
        isLoading,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addLifeEvent,
        deleteLifeEvent,
        refreshRecurringInvestments,
        refreshData
    };
}

export default usePortfolio;
