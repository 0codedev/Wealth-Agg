import { useSettingsStore } from '../store/settingsStore';
import {
    fetchInsiderTrades,
    fetchBulkDeals,
    fetchMacroIndicators,
    fetchGlobalIndices,
    fetchIndianIndices,
    hasAnyApiKey,
    getMockInsider,
    getMockBulk,
    InsiderTrade,
    BulkDeal,
    MacroIndicator,
    MarketQuote
} from './RealDataService';
import { logger } from './Logger';

class MarketDataService {

    private CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 Hours (Legacy Setting, RealDataService handles its own cache now)

    // Re-export methods from RealDataService for backward compatibility if needed,
    // or just implementation methods.

    async fetchInsiderTrades(forceRefresh = false): Promise<InsiderTrade[]> {
        // Delegate to RealDataService
        logger.debug('MarketDataService: Delegating Insider fetch to RealDataService');
        return fetchInsiderTrades();
    }

    async fetchBulkDeals(forceRefresh = false): Promise<BulkDeal[]> {
        // Delegate to RealDataService
        logger.debug('MarketDataService: Delegating Bulk fetch to RealDataService');
        return fetchBulkDeals();
    }

    getMockInsider(): InsiderTrade[] {
        return getMockInsider();
    }

    getMockBulk(): BulkDeal[] {
        return getMockBulk();
    }

    async fetchMacroAndGlobal(forceRefresh = false): Promise<{
        macro: MacroIndicator[],
        global: MacroIndicator[]
    }> {
        logger.debug('MarketDataService: Delegating Macro/Global fetch to RealDataService');

        // Parallel fetch
        const [macro, global] = await Promise.all([
            fetchMacroIndicators(),
            fetchGlobalIndices()
        ]);

        return { macro, global };
    }

    // Helper to check if we are truly live
    isLive(): boolean {
        const { dataMode } = useSettingsStore.getState();
        return dataMode === 'LIVE';
    }
}

export const marketDataService = new MarketDataService();
export type { InsiderTrade, BulkDeal, MacroIndicator, MarketQuote };
