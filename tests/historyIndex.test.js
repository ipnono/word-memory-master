import { describe, it, expect } from 'vitest';
import { recentN } from '../src/historyIndex.js';

const W = (id, addedAt, word, coreMeaning) => ({
  id, addedAt, card: { word, coreMeaning },
});

describe('historyIndex', () => {
  describe('recentN (slice #7)', () => {
    it('returns the last N entries by addedAt, descending', () => {
      const words = [
        W('a', 1, 'abandon', '放弃'),
        W('b', 2, 'ban',     '禁止'),
        W('c', 3, 'candy',   '糖果'),
        W('d', 4, 'diligent','勤奋'),
      ];
      const recent = recentN(words, 2);
      expect(recent.map(r => r.word)).toEqual(['diligent', 'candy']);
    });

    it('returns all entries if input has fewer than N', () => {
      const words = [W('a', 1, 'a', 'A'), W('b', 2, 'b', 'B')];
      const recent = recentN(words, 10);
      expect(recent.length).toBe(2);
    });

    it('returns an empty array when input is empty', () => {
      expect(recentN([], 10)).toEqual([]);
    });

    it('returns each item as {word, coreMeaning}', () => {
      const words = [W('a', 1, 'abandon', '放弃')];
      const [item] = recentN(words, 1);
      expect(item).toEqual({ word: 'abandon', coreMeaning: '放弃' });
    });

    it('omits coreMeaning key when missing (falls back to bare word)', () => {
      const words = [{ id: 'a', addedAt: 1, card: { word: 'abandon' } }];
      const [item] = recentN(words, 1);
      expect(item).toEqual({ word: 'abandon' });
    });
  });
});
