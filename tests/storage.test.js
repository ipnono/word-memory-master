import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSettings, setSettings, getWords, addWord, deleteWord, updateWordRating, getDateKey, getDateKeys, getWordsByDate } from '../src/storage.js';

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

  describe('updateWordRating (slice #6)', () => {
    it('sets rating + ratedAt on the matching entry', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      addWord(e1);
      const now = 1700000000000;
      vi.setSystemTime(new Date(now));
      updateWordRating('a', 'knew');
      const updated = getWords().find(w => w.id === 'a');
      expect(updated.rating).toBe('knew');
      expect(updated.ratedAt).toBe(now);
    });

    it('preserves other fields on the entry', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      addWord(e1);
      updateWordRating('a', 'fuzzy');
      const updated = getWords().find(w => w.id === 'a');
      expect(updated.id).toBe('a');
      expect(updated.addedAt).toBe(1);
      expect(updated.card.word).toBe('abandon');
    });

    it('is a no-op when id does not match', () => {
      const e1 = { id: 'a', addedAt: 1, card: { word: 'abandon' } };
      addWord(e1);
      updateWordRating('nonexistent', 'didnt');
      expect(getWords()).toEqual([e1]);
    });
  });

  describe('date helpers (slice #11)', () => {
    describe('getDateKey', () => {
      it('formats a timestamp as local "YYYY-MM-DD"', () => {
        const ts = new Date(2026, 5, 13, 14, 30).getTime();
        expect(getDateKey(ts)).toBe('2026-06-13');
      });
    });

    describe('getDateKeys', () => {
      const day = (date, h) => new Date(`${date}T${String(h).padStart(2,'0')}:00:00`).getTime();
      it('returns unique date keys sorted descending', () => {
        const words = [
          { id: 'a', addedAt: day('2026-06-13', 10), card: { word: 'a' } },
          { id: 'b', addedAt: day('2026-06-13', 14), card: { word: 'b' } },
          { id: 'c', addedAt: day('2026-06-12',  9), card: { word: 'c' } },
          { id: 'd', addedAt: day('2026-06-10',  9), card: { word: 'd' } },
        ];
        expect(getDateKeys(words)).toEqual(['2026-06-13', '2026-06-12', '2026-06-10']);
      });

      it('returns empty array when no words', () => {
        expect(getDateKeys([])).toEqual([]);
      });
    });

    describe('getWordsByDate', () => {
      const day = (date, h) => new Date(`${date}T${String(h).padStart(2,'0')}:00:00`).getTime();
      it('returns only words whose addedAt falls on the given date', () => {
        const words = [
          { id: 'a', addedAt: day('2026-06-13', 10), card: { word: 'a' } },
          { id: 'b', addedAt: day('2026-06-12', 10), card: { word: 'b' } },
          { id: 'c', addedAt: day('2026-06-13', 14), card: { word: 'c' } },
        ];
        const r = getWordsByDate(words, '2026-06-13');
        expect(r.map(w => w.id).sort()).toEqual(['a', 'c']);
      });

      it('returns empty array when no words match', () => {
        const words = [{ id: 'a', addedAt: day('2026-06-13', 10), card: { word: 'a' } }];
        expect(getWordsByDate(words, '2026-06-14')).toEqual([]);
      });
    });
  });
});
