import { describe, it, expect, beforeEach } from 'vitest';
import { exportAll, importAll } from '../src/exporter.js';
import { getSettings, setSettings, addWord } from '../src/storage.js';

function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
}

beforeEach(() => {
  globalThis.localStorage = createMockLocalStorage();
});

describe('exporter', () => {
  describe('exportAll', () => {
    it('returns a JSON object with version, exportedAt, settings, words', () => {
      const data = exportAll();
      expect(data.version).toBe(1);
      expect(typeof data.exportedAt).toBe('number');
      expect(data.settings).toBeTruthy();
      expect(Array.isArray(data.words)).toBe(true);
    });

    it('reflects current settings + words from storage', () => {
      setSettings({ apiKey: 'sk-test', historySize: 50 });
      addWord({ id: 'x', addedAt: 1, card: { word: 'abandon' } });
      const data = exportAll();
      expect(data.settings.apiKey).toBe('sk-test');
      expect(data.settings.historySize).toBe(50);
      expect(data.words.length).toBe(1);
      expect(data.words[0].card.word).toBe('abandon');
    });
  });

  describe('importAll', () => {
    it('restores settings + words from a valid export blob', () => {
      setSettings({ apiKey: 'before' });
      addWord({ id: 'a', addedAt: 1, card: { word: 'abandon' } });
      const data = exportAll();

      // wipe
      globalThis.localStorage = createMockLocalStorage();
      expect(getSettings().apiKey).toBe(''); // default after wipe

      const result = importAll(data);
      expect(result.ok).toBe(true);
      expect(getSettings().apiKey).toBe('before');
    });

    it('rejects malformed JSON (missing version)', () => {
      const result = importAll({ settings: {}, words: [] });
      expect(result.ok).toBe(false);
      expect(result.errors.join(' ')).toMatch(/version/);
    });

    it('rejects malformed JSON (settings not an object)', () => {
      const result = importAll({ version: 1, exportedAt: 1, settings: 'nope', words: [] });
      expect(result.ok).toBe(false);
      expect(result.errors.join(' ')).toMatch(/settings/);
    });

    it('rejects malformed JSON (words not an array)', () => {
      const result = importAll({ version: 1, exportedAt: 1, settings: {}, words: 'nope' });
      expect(result.ok).toBe(false);
      expect(result.errors.join(' ')).toMatch(/words/);
    });

    it('does NOT corrupt localStorage on invalid input', () => {
      setSettings({ apiKey: 'preserved' });
      addWord({ id: 'a', addedAt: 1, card: { word: 'abandon' } });
      const before = exportAll();

      importAll({ version: 1, settings: 'bad', words: [] });

      const after = exportAll();
      expect(after.settings.apiKey).toBe('preserved');
      expect(after.words.length).toBe(1);
    });
  });
});
