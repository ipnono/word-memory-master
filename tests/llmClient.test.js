import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { complete } from '../src/llmClient.js';

describe('llmClient', () => {
  describe('complete (slice #2 — basic POST, no retry, no JSON parsing)', () => {
    let fetchSpy;

    beforeEach(() => {
      fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
        }),
      });
      globalThis.fetch = fetchSpy;
    });

    afterEach(() => {
      delete globalThis.fetch;
    });

    it('POSTs to {apiBaseUrl}/chat/completions', async () => {
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      await complete({ systemMsg: 'S', userMsg: 'U', settings });
      const [calledUrl] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://api.example.com/v1/chat/completions');
    });

    it('sends an Authorization Bearer header with the API key', async () => {
      const settings = {
        apiBaseUrl: 'https://api.example.com/v1',
        model: 'm',
        apiKey: 'sk-test-1234',
      };
      await complete({ systemMsg: 'S', userMsg: 'U', settings });
      const [, init] = fetchSpy.mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer sk-test-1234');
    });

    it('sends messages in order: system, then user', async () => {
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      await complete({ systemMsg: 'SYS-CONTENT', userMsg: 'USER-CONTENT', settings });
      const [, init] = fetchSpy.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.model).toBe('m');
      expect(body.messages).toEqual([
        { role: 'system', content: 'SYS-CONTENT' },
        { role: 'user', content: 'USER-CONTENT' },
      ]);
    });
  });

  describe('error handling', () => {
    it('returns {ok: false, error} when fetch throws (network failure)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('NetworkError'));
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('NetworkError');
    });

    it('returns {ok: false, error} when response is non-2xx', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'invalid api key' } }),
      });
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/401/);
    });
  });

  describe('JSON parsing (slice #3)', () => {
    function mockJsonResponse(content) {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content } }] }),
      });
    }

    it('returns {ok: true, card} when response is valid JSON', async () => {
      const card = { word: 'abandon', phonetic: '/x/', coreMeaning: '放弃' };
      mockJsonResponse(JSON.stringify(card));
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(true);
      expect(result.card.word).toBe('abandon');
    });

    it('strips ```json``` markdown fences before parsing', async () => {
      const card = { word: 'ban', phonetic: '/b/', coreMeaning: '禁止' };
      mockJsonResponse('```json\n' + JSON.stringify(card) + '\n```');
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(true);
      expect(result.card.word).toBe('ban');
    });

    it('returns {ok: false, raw} when response is not JSON', async () => {
      mockJsonResponse('📌 abandon /əˈbændən/ - 难度评级: B2\n...');
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(false);
      expect(result.raw).toContain('abandon');
    });

    it('returns {ok: false, raw} when JSON parses but fails schema validation', async () => {
      // missing word/phonetic/coreMeaning
      mockJsonResponse(JSON.stringify({ word: '', phonetic: '', coreMeaning: '' }));
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(false);
      expect(typeof result.raw).toBe('string');
    });
  });

  describe('retry on JSON parse failure (slice #9)', () => {
    function mockSequence(responses) {
      let i = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        const content = responses[i++];
        return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
      });
    }
    const STRICT_SUFFIX = /仅返回原始 JSON|无 markdown|不要.*代码块/;
    const VALID_CARD = { word: 'abandon', phonetic: '/x/', coreMeaning: '放弃' };

    it('returns ok on first valid response without retrying', async () => {
      mockSequence([JSON.stringify(VALID_CARD)]);
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(result.ok).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries once with stricter suffix when first response fails to parse', async () => {
      mockSequence(['not json at all', JSON.stringify(VALID_CARD)]);
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      const [, init2] = globalThis.fetch.mock.calls[1];
      const body2 = JSON.parse(init2.body);
      expect(body2.messages[1].content).toMatch(STRICT_SUFFIX);
    });

    it('returns {ok:false, raw} when both attempts fail', async () => {
      mockSequence(['bad', 'still bad']);
      const settings = { apiBaseUrl: 'https://api.example.com/v1', model: 'm' };
      const result = await complete({ systemMsg: 'S', userMsg: 'U', settings });
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(false);
      expect(result.raw).toBe('still bad');
    });
  });
});
