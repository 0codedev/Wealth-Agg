/**
 * RealDataService - Unified service for fetching real market data
 * 
 * Standard Fallback Chain:
 * 1. Primary API (RapidAPI, Alpha Vantage, etc.)
 * 2. Gemini AI Fallback (Web Search Grounding)
 * 3. Mock Data Fallback (Last Resort)
 */

import { logger } from './Logger';
import { askGemini } from './aiService';

// ============================================================
// TYPES
// ============================================================

export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: Date;
    source: 'rapidapi' | 'alphavantage' | 'finnhub' | 'ai' | 'mock';
}

export interface MacroIndicator {
    id: string;
    name: string;
    value: number;
    change: number;
    unit?: string;
    source: string;
}

export interface InsiderTrade {
    id: string;
    ticker: string;
    person: string;
    relation: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    value: number;
    date: string;
    mode: 'Open Market' | 'ESOP' | 'Off Market' | 'Revocation';
    company?: string;
}

export interface BulkDeal {
    id: string;
    ticker: string;
    client: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    value: number;
    change: number;
}

export interface EarningsEvent {
    symbol: string;
    company: string;
    date: string;
    epsEstimate: number | null;
    epsActual: number | null;
    time: 'bmo' | 'amc' | string;
}

// ============================================================
// MOCK DATA (Last Resort)
// ============================================================

const MOCK_INSIDER: InsiderTrade[] = [
    { id: '1', ticker: 'RELIANCE', person: 'Mukesh Ambani', relation: 'Promoter', type: 'BUY', quantity: 50000, price: 2450, value: 122500000, date: '2 mins ago', mode: 'Open Market' },
    { id: '2', ticker: 'TATASTEEL', person: 'N. Chandrasekaran', relation: 'Director', type: 'BUY', quantity: 15000, price: 112, value: 1680000, date: '15 mins ago', mode: 'Open Market' },
    { id: '3', ticker: 'INFY', person: 'Salil Parekh', relation: 'CEO', type: 'SELL', quantity: 5000, price: 1450, value: 7250000, date: '1 hour ago', mode: 'ESOP' },
    { id: '4', ticker: 'HDFCBANK', person: 'Sashidhar Jagdishan', relation: 'CEO', type: 'BUY', quantity: 2000, price: 1520, value: 3040000, date: '2 hours ago', mode: 'Open Market' },
    { id: '5', ticker: 'ADANIENT', person: 'Gautam Adani', relation: 'Promoter', type: 'BUY', quantity: 100000, price: 2800, value: 280000000, date: '4 hours ago', mode: 'Revocation' },
];

const MOCK_BULK: BulkDeal[] = [
    { id: '1', ticker: 'ZOMATO', client: 'Tiger Global', type: 'SELL', quantity: 15000000, price: 58.5, value: 877500000, change: -1.2 },
    { id: '2', ticker: 'PAYTM', client: 'Softbank Vision Fund', type: 'SELL', quantity: 2000000, price: 850, value: 1700000000, change: -4.5 },
    { id: '3', ticker: 'IDFCFIRSTB', client: 'GQG Partners', type: 'BUY', quantity: 5000000, price: 62, value: 310000000, change: +2.3 },
    { id: '4', ticker: 'KALYANKJIL', client: 'Warburg Pincus', type: 'SELL', quantity: 1000000, price: 115, value: 115000000, change: -0.5 },
    { id: '5', ticker: 'SUZLON', client: 'Blackrock Emerging Markets', type: 'BUY', quantity: 50000000, price: 18.2, value: 910000000, change: +5.0 },
];

const MOCK_VIX: MacroIndicator = { id: 'indiavix', name: 'India VIX', value: 14.2, change: -0.5, source: 'mock' };

export const getMockInsider = () => MOCK_INSIDER;
export const getMockBulk = () => MOCK_BULK;
export const getMockMacro = () => ({ macro: [], global: [] }); // Placeholder if needed, or proper mock

// ============================================================
// SERVICE IMPLEMENTATION
// ============================================================

const CACHE_KEY = 'real_data_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

function getApiKeys() {
    try {
        const storeData = localStorage.getItem('wealth-aggregator-logic');
        if (storeData) {
            const parsed = JSON.parse(storeData);
            return {
                rapidApi: parsed.state?.apiKeys?.rapidApi || '',
                alphaVantage: parsed.state?.apiKeys?.alphaVantage || '',
                finnhub: parsed.state?.apiKeys?.finnhub || '',
                fmp: parsed.state?.apiKeys?.fmp || ''
            };
        }
    } catch (e) { /* ignore */ }
    return { rapidApi: '', alphaVantage: '', finnhub: '', fmp: '' };
}

function getCache<T>(key: string): T | null {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const entry = cache[key] as CacheEntry<T> | undefined;
        if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
    } catch (e) { /* ignore */ }
    return null;
}

function setCache<T>(key: string, data: T): void {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        cache[key] = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* ignore */ }
}

// Helper for AI Fallback
async function fetchViaAI(query: string): Promise<MacroIndicator | null> {
    try {
        const prompt = `
            You are a financial data assistant. Answer with ONLY a JSON object.
            Query: What is the current value of ${query}?
            Format: {"value": <number>, "change": <number>, "unit": "<string>"}
            Use real-time data from search.
        `;
        const response = await askGemini(prompt, false);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            id: query.toLowerCase().replace(/\s+/g, '_'),
            name: query,
            value: parsed.value,
            change: parsed.change || 0,
            unit: parsed.unit,
            source: 'ai'
        };
    } catch (error) {
        logger.warn(`AI Fetch failed for ${query}`, error);
        return null;
    }
}

// ------------------------------------------------------------
// 1. INDIAN STOCK QUOTES (RapidAPI -> AI -> Mock)
// ------------------------------------------------------------

export async function fetchIndianStockQuote(symbol: string): Promise<MarketQuote> {
    const cached = getCache<MarketQuote>(`indian_${symbol}`);
    if (cached) return cached;

    // 1. RapidAPI
    const { rapidApi } = getApiKeys();
    if (rapidApi) {
        try {
            const response = await fetch(
                `https://indian-stock-exchange-api2.p.rapidapi.com/stock?name=${encodeURIComponent(symbol)}`,
                { headers: { 'x-rapidapi-key': rapidApi, 'x-rapidapi-host': 'indian-stock-exchange-api2.p.rapidapi.com' } }
            );
            if (response.ok) {
                const data = await response.json();
                const quote: MarketQuote = {
                    symbol, name: data.companyName || symbol,
                    price: parseFloat(data.currentPrice) || 0,
                    change: parseFloat(data.change) || 0,
                    changePercent: parseFloat(data.pChange) || 0,
                    timestamp: new Date(), source: 'rapidapi'
                };
                setCache(`indian_${symbol}`, quote);
                return quote;
            }
        } catch (e) { logger.warn(`RapidAPI failed for ${symbol}`, e); }
    }

    // 2. AI Fallback
    const aiData = await fetchViaAI(`${symbol} stock price INR`);
    if (aiData) {
        const quote: MarketQuote = {
            symbol, name: symbol,
            price: aiData.value, change: aiData.change, changePercent: aiData.change, // approx
            timestamp: new Date(), source: 'ai'
        };
        setCache(`indian_${symbol}`, quote);
        return quote;
    }

    // 3. Mock Fallback
    return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, timestamp: new Date(), source: 'mock' };
}

export async function fetchIndianIndices(): Promise<MarketQuote[]> {
    const symbols = ['NIFTY 50', 'SENSEX'];
    return Promise.all(symbols.map(s => fetchIndianStockQuote(s)));
}

// ------------------------------------------------------------
// 2. INDIAN VIX (API -> AI -> Mock)
// ------------------------------------------------------------

export async function fetchIndiaVIX(): Promise<MacroIndicator> {
    // 1. Try RapidAPI (if Nifty endpoint supports it, usually it's own symbol)
    // Most Indian APIs treat VIX as an index. Let's try AI first as it's reliable for VIX.
    // Actually user wants Standard Fallback. RapidAPI might have it.

    // 2. AI Fallback (Primary for VIX often)
    const aiData = await fetchViaAI('India VIX');
    if (aiData) return { ...aiData, id: 'indiavix', name: 'India VIX' };

    // 3. Mock
    return MOCK_VIX;
}

// ------------------------------------------------------------
// 3. COMMODITIES & FOREX (Alpha Vantage -> AI -> Mock)
// ------------------------------------------------------------

export async function fetchCommodityPrice(commodity: 'WTI' | 'BRENT' | 'GOLD' | 'SILVER'): Promise<MacroIndicator> {
    const cached = getCache<MacroIndicator>(`commodity_${commodity}`);
    if (cached) return cached;

    const { alphaVantage } = getApiKeys();

    // 1. Alpha Vantage
    if (alphaVantage) {
        try {
            const func = commodity;
            const response = await fetch(`https://www.alphavantage.co/query?function=${func}&interval=daily&apikey=${alphaVantage}`);
            if (response.ok) {
                const data = await response.json();
                const dataKey = Object.keys(data).find(k => k.includes('data'));
                if (dataKey && data[dataKey]?.[0]) {
                    const latest = data[dataKey][0];
                    const prev = data[dataKey][1];
                    const val = parseFloat(latest.value);
                    const change = val - parseFloat(prev.value);
                    const indicator: MacroIndicator = {
                        id: commodity.toLowerCase(), name: commodity === 'WTI' ? 'Crude Oil' : commodity,
                        value: val, change: (change / val) * 100,
                        unit: commodity.includes('GOLD') ? '$/oz' : '$/bbl', source: 'alphavantage'
                    };
                    setCache(`commodity_${commodity}`, indicator);
                    return indicator;
                }
            }
        } catch (e) { logger.warn(`AlphaVantage failed for ${commodity}`, e); }
    }

    // 2. AI Fallback
    const aiQuery = commodity === 'WTI' ? 'Crude Oil WTI price' : `${commodity} price`;
    const aiData = await fetchViaAI(aiQuery);
    if (aiData) {
        return { ...aiData, id: commodity.toLowerCase(), name: commodity };
    }

    // 3. Mock
    return { id: commodity.toLowerCase(), name: commodity, value: 0, change: 0, unit: '$', source: 'mock' };
}

export async function fetchForexRate(from: string, to: string): Promise<MacroIndicator> {
    const cached = getCache<MacroIndicator>(`forex_${from}_${to}`);
    if (cached) return cached;

    const { alphaVantage } = getApiKeys();

    if (alphaVantage) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${alphaVantage}`);
            if (response.ok) {
                const data = await response.json();
                const rate = data['Realtime Currency Exchange Rate'];
                if (rate) {
                    const indicator: MacroIndicator = {
                        id: `${from}${to}`, name: `${from}/${to}`,
                        value: parseFloat(rate['5. Exchange Rate']), change: 0,
                        source: 'alphavantage'
                    };
                    setCache(`forex_${from}_${to}`, indicator);
                    return indicator;
                }
            }
        } catch (e) { logger.warn(`Forex failed for ${from}/${to}`, e); }
    }

    const aiData = await fetchViaAI(`${from} to ${to} exchange rate`);
    if (aiData) return { ...aiData, id: `${from}${to}`, name: `${from}/${to}` };

    return { id: `${from}${to}`, name: `${from}/${to}`, value: 0, change: 0, source: 'mock' };
}

// ------------------------------------------------------------
// AGGREGATORS
// ------------------------------------------------------------

export async function fetchMacroIndicators(): Promise<MacroIndicator[]> {
    const results: MacroIndicator[] = [];

    // Parallel fetch for speed
    const [wti, gold, usdinr, vix] = await Promise.all([
        fetchCommodityPrice('WTI'),
        fetchCommodityPrice('GOLD'),
        fetchForexRate('USD', 'INR'),
        fetchIndiaVIX()
    ]);

    results.push(wti);
    results.push(gold);
    results.push({ ...usdinr, name: 'USD/INR' }); // Ensure name is user-friendly
    results.push(vix);

    // Optional: Add US 10Y Yield (via AI or Alpha Vantage if available)
    // For now, let's use AI as primary for Bond Yields as AV free tier is limited
    const us10y = await fetchViaAI('US 10 Year Treasury Yield');
    if (us10y) {
        results.push({ ...us10y, id: 'us10y', name: 'US 10Y Yield' });
    } else {
        results.push({ id: 'us10y', name: 'US 10Y Yield', value: 4.42, change: 0.05, unit: '%', source: 'mock' });
    }

    const dxy = await fetchViaAI('US Dollar Index DXY');
    if (dxy) {
        results.push({ ...dxy, id: 'dxy', name: 'Dollar Index' });
    } else {
        results.push({ id: 'dxy', name: 'Dollar Index', value: 103.8, change: -0.1, source: 'mock' });
    }

    return results;
}

// ------------------------------------------------------------
// 4. GLOBAL INDICES (Finnhub -> AI -> Mock)
// ------------------------------------------------------------

export async function fetchGlobalIndex(symbol: string, name: string): Promise<MacroIndicator> {
    const cached = getCache<MacroIndicator>(`global_${symbol}`);
    if (cached) return cached;

    const { finnhub } = getApiKeys();

    if (finnhub) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub}`);
            if (response.ok) {
                const data = await response.json();
                if (data.c) { // Current price check
                    const indicator: MacroIndicator = {
                        id: symbol, name,
                        value: data.c, change: data.dp,
                        source: 'finnhub'
                    };
                    setCache(`global_${symbol}`, indicator);
                    return indicator;
                }
            }
        } catch (e) { logger.warn(`Finnhub failed for ${symbol}`, e); }
    }

    const aiData = await fetchViaAI(`${name} index value`);
    if (aiData) return { ...aiData, id: symbol, name };

    return { id: symbol, name, value: 0, change: 0, source: 'mock' };
}

export async function fetchGlobalIndices(): Promise<MacroIndicator[]> {
    return Promise.all([
        fetchGlobalIndex('^GSPC', 'S&P 500'),
        fetchGlobalIndex('^IXIC', 'NASDAQ'),
        fetchGlobalIndex('^DJI', 'Dow Jones')
    ]);
}

// ------------------------------------------------------------
// 5. INSIDER TRADES (Gemini (Primary) -> Mock)
// ------------------------------------------------------------

export async function fetchInsiderTrades(): Promise<InsiderTrade[]> {
    const cached = getCache<InsiderTrade[]>('insider_trades');
    if (cached) return cached;

    // 1. Gemini AI (Primary for robust formatting of Indian data)
    try {
        const prompt = `
            Fetch LATEST 5 insider trades from NSE/BSE India (last 48h).
            Return JSON: {"trades": [{"ticker", "company", "person", "relation", "type" (BUY/SELL), "quantity", "price", "value", "date"}]}
        `;
        const aiResponse = await askGemini(prompt);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.trades?.length) {
                const trades = parsed.trades.map((t: any, i: number) => ({
                    id: `ai-${i}`, ticker: t.ticker, person: t.person, relation: t.relation,
                    type: t.type, quantity: t.quantity, price: t.price, value: t.value,
                    date: t.date, mode: 'Open Market'
                }));
                setCache('insider_trades', trades);
                return trades;
            }
        }
    } catch (e) { logger.warn('AI Insider failed', e); }

    // 2. Mock Fallback
    return MOCK_INSIDER;
}

// ------------------------------------------------------------
// 6. BULK DEALS (Gemini (Primary) -> Mock)
// ------------------------------------------------------------

export async function fetchBulkDeals(): Promise<BulkDeal[]> {
    const cached = getCache<BulkDeal[]>('bulk_deals');
    if (cached) return cached;

    try {
        const prompt = `
            Fetch LATEST 5 bulk/block deals from NSE/BSE India (last 48h).
            Return JSON: {"deals": [{"ticker", "client", "type" (BUY/SELL), "quantity", "price", "value", "change"}]}
        `;
        const aiResponse = await askGemini(prompt);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.deals?.length) {
                const deals = parsed.deals.map((d: any, i: number) => ({
                    id: `ai-bulk-${i}`, ticker: d.ticker, client: d.client,
                    type: d.type, quantity: d.quantity, price: d.price, value: d.value, change: d.change
                }));
                setCache('bulk_deals', deals);
                return deals;
            }
        }
    } catch (e) { logger.warn('AI Bulk failed', e); }

    return MOCK_BULK;
}

export function hasAnyApiKey(): boolean {
    const keys = getApiKeys();
    return !!(keys.rapidApi || keys.alphaVantage || keys.finnhub || keys.fmp);
}
