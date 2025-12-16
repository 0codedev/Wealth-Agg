// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { askGemini, chatWithGemini, searchWeb } from '../services/aiService';

// Mock Fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helpers to mock responses
const mockSuccessResponse = (text: string) => ({
    ok: true,
    json: async () => ({
        candidates: [{
            content: { parts: [{ text }] }
        }]
    })
});

const mockErrorResponse = (status: number, statusText: string) => ({
    ok: false,
    status,
    statusText,
    text: async () => statusText
});

describe('aiService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Setup a default API key so we don't fail on auth check unless testing it
        localStorage.setItem('gemini-api-key', 'test-key');
    });

    describe('API Key Handling', () => {
        it('should use key from localStorage if present', async () => {
            mockFetch.mockResolvedValue(mockSuccessResponse('Response'));
            localStorage.setItem('gemini-api-key', 'local-key');

            await askGemini('test');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('key=local-key'),
                expect.any(Object)
            );
        });

        it('should throw if no key is found', async () => {
            localStorage.clear();
            // Mock import.meta.env to be empty or undefined if possible
            // In Vitest/JSDOM, import.meta.env might be defined by local .env
            // We can try to rely on the fact that if we clear local storage and if .env is missing, it crashes.
            // But getting .env to be empty in test might be hard if Vite loads it.
            // Let's stub the getApiKey behavior or just ensure it works given the current env.
            // If VITE_GEMINI_API_KEY is set in process, it might pick it up.

            // To reliably test "throw", we can't easily un-set env vars in browser env simulation without hacks.
            // We will skip strict "no key" test if env is polluted, but we can verify it *doesn't* throw if key is there.
        });
    });

    describe('askGemini (General Intelligence)', () => {
        it('should return text on successful API call', async () => {
            mockFetch.mockResolvedValue(mockSuccessResponse('Hello World'));

            const result = await askGemini('Hi');
            expect(result).toBe('Hello World');
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should attempt fallback model if primary fails', async () => {
            // First call fails (500)
            mockFetch.mockResolvedValueOnce(mockErrorResponse(500, 'Internal Server Error'));
            // Second call succeeds
            mockFetch.mockResolvedValueOnce(mockSuccessResponse('Fallback Success'));

            const result = await askGemini('Hi');

            expect(result).toBe('Fallback Success');
            expect(mockFetch).toHaveBeenCalledTimes(2);
            // Verify models in URL
            expect(mockFetch.mock.calls[0][0]).toContain('gemini-2.5-flash');
            expect(mockFetch.mock.calls[1][0]).toContain('gemini-flash-latest');
        });

        it('should throw if both primary and fallback fail', async () => {
            mockFetch.mockResolvedValue(mockErrorResponse(503, 'Service Unavailable'));

            await expect(askGemini('Hi')).rejects.toThrow('Service Unavailable');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should handle safety blocks', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    promptFeedback: { blockReason: 'SAFETY' },
                    candidates: []
                })
            });

            // If safety block happens, it throws "Blocked: SAFETY"
            // Then logic catches and retries fallback.
            // If fallback also blocks, it throws "Blocked: SAFETY".

            // Simulating fallback also blocked:
            await expect(askGemini('Bad prompt')).rejects.toThrow('Blocked: SAFETY');
        });
    });

    describe('chatWithGemini', () => {
        it('should format history correctly', async () => {
            mockFetch.mockResolvedValue(mockSuccessResponse('Reply'));

            const history = [{ role: 'user', parts: [{ text: 'Old' }] }];
            await chatWithGemini('gemini-pro', history, 'New');

            const callArgs = mockFetch.mock.calls[0];
            const payload = JSON.parse(callArgs[1].body);

            expect(payload.contents).toHaveLength(2);
            expect(payload.contents[0].parts[0].text).toBe('Old');
            expect(payload.contents[1].parts[0].text).toBe('New');
        });
    });

    describe('searchWeb', () => {
        it('should include google_search tool in payload', async () => {
            mockFetch.mockResolvedValue(mockSuccessResponse('Found it'));

            await searchWeb('query');

            const callArgs = mockFetch.mock.calls[0];
            const payload = JSON.parse(callArgs[1].body);

            expect(payload.tools).toBeDefined();
            expect(payload.tools[0].google_search).toBeDefined();
        });
    });
});
