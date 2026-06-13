import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, setSettings, getWords, addWord, deleteWord } from '../src/storage.js';

// Minimal localStorage stub — Vitest runs in Node, where localStorage
// does not exist by default. We attach a fresh mock to globalThis
// before each test.
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

describe('storage', () => {
  describe('getSettings', () => {
    it('returns seeded defaults when localStorage is empty', () => {
      const s = getSettings();
      expect(s.apiBaseUrl).toBe('https://api.MiniMax.chat/v1');
      expect(s.model).toBe('MiniMax-M3');
      expect(s.historySize).toBe(30);
      expect(s.useProxy).toBe(false);
      expect(s.useJsonMode).toBe(true);
    });
  });

  describe('setSettings', () => {
    it('merges partial update; other fields are preserved', () => {
      setSettings({ apiKey: 'sk-test-1234' });
      const s = getSettings();
      expect(s.apiKey).toBe('sk-test-1234');
      expect(s.apiBaseUrl).toBe('https://api.MiniMax.chat/v1');
      expect(s.model).toBe('MiniMax-M3');
      expect(s.historySize).toBe(30);
    });

    it('persists across calls (write then read)', () => {
      setSettings({ historySize: 50, voice: 'en-GB' });
      const s = getSettings();
      expect(s.historySize).toBe(50);
      expect(s.voice).toBe('en-GB');
    });
  });

  describe('getWords', () => {
    it('returns an empty array when no words have been saved', () => {
      expect(getWords()).toEqual([]);
    });
  });

  describe('addWord', () => {
    it('appends an entry; subsequent getWords returns it', () => {
      const entry = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      addWord(entry);
      expect(getWords()).toEqual([entry]);
    });

    it('appends in order; previous entries are preserved', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      const e2 = { id: 'b', addedAt: 2, card: { word: 'ban' } };
      const e3 = { id: 'c', addedAt: 3, card: { word: 'candy' } };
      addWord(e1);
      addWord(e2);
      addWord(e3);
      expect(getWords()).toEqual([e1, e2, e3]);
    });
  });

  describe('deleteWord', () => {
    it('removes the entry with matching id; others preserved', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      const e2 = { id: 'b', addedAt: 2, card: { word: 'ban' } };
      const e3 = { id: 'c', addedAt: 3, card: { word: 'candy' } };
      addWord(e1);
      addWord(e2);
      addWord(e3);
      deleteWord('b');
      expect(getWords()).toEqual([e1, e3]);
    });

    it('is a no-op when id does not match any entry', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      addWord(e1);
      deleteWord('nonexistent');
      expect(getWords()).toEqual([e1]);
    });
  });
});
