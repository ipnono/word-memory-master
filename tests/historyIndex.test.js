import { describe, it, expect } from 'vitest';
import { recentN, groupByDate, filterByQuery } from '../src/historyIndex.js';

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
      expect(recentN(words, 10).length).toBe(2);
    });

    it('returns an empty array when input is empty', () => {
      expect(recentN([], 10)).toEqual([]);
    });

    it('returns each item as {word, coreMeaning}', () => {
      const [item] = recentN([W('a', 1, 'abandon', '放弃')], 1);
      expect(item).toEqual({ word: 'abandon', coreMeaning: '放弃' });
    });

    it('omits coreMeaning key when missing', () => {
      const [item] = recentN([{ id: 'a', addedAt: 1, card: { word: 'abandon' } }], 1);
      expect(item).toEqual({ word: 'abandon' });
    });
  });

  describe('groupByDate (slice #8)', () => {
    const now = new Date(2026, 5, 13, 14, 0); // 2026-06-13 14:00 local
    const day = (d) => new Date(d).setHours(12, 0, 0, 0); // noon

    it('returns all-empty groups when words is empty', () => {
      const g = groupByDate([], now);
      expect(g.Today).toEqual([]);
      expect(g.Yesterday).toEqual([]);
      expect(g.ThisWeek).toEqual([]);
      expect(g.Earlier).toEqual([]);
    });

    it("places today's words in Today", () => {
      const w = W('a', day('2026-06-13'), 'today-word');
      const g = groupByDate([w], now);
      expect(g.Today.length).toBe(1);
      expect(g.Yesterday).toEqual([]);
      expect(g.ThisWeek).toEqual([]);
      expect(g.Earlier).toEqual([]);
    });

    it("places yesterday's words in Yesterday", () => {
      const w = W('a', day('2026-06-12'), 'yest-word');
      const g = groupByDate([w], now);
      expect(g.Today).toEqual([]);
      expect(g.Yesterday.length).toBe(1);
      expect(g.ThisWeek).toEqual([]);
      expect(g.Earlier).toEqual([]);
    });

    it('places 2-6 day old words in ThisWeek', () => {
      const w = W('a', day('2026-06-09'), 'this-week'); // 4 days ago
      const g = groupByDate([w], now);
      expect(g.ThisWeek.length).toBe(1);
      expect(g.Earlier).toEqual([]);
    });

    it('places 7+ day old words in Earlier', () => {
      const w = W('a', day('2026-06-01'), 'old');
      const g = groupByDate([w], now);
      expect(g.Earlier.length).toBe(1);
      expect(g.ThisWeek).toEqual([]);
    });

    it('sorts each group newest first', () => {
      const words = [
        W('a', day('2026-06-13'),     'now'),
        W('b', day('2026-06-13T10:00'),'earlier-today'),
      ];
      const g = groupByDate(words, now);
      expect(g.Today.map(w => w.id)).toEqual(['a', 'b']);
    });
  });

  describe('filterByQuery (slice #8)', () => {
    const words = [
      W('a', 1, 'abandon'),
      W('b', 2, 'Ban'),
      W('c', 3, 'candy'),
      W('d', 4, 'diligent'),
    ];

    it('returns all when query is empty', () => {
      expect(filterByQuery(words, '').length).toBe(4);
    });

    it('matches case-insensitively', () => {
      const r = filterByQuery(words, 'ban');
      expect(r.length).toBe(2);
      expect(r.map(w => w.id).sort()).toEqual(['a', 'b']);
    });

    it('matches substring', () => {
      expect(filterByQuery(words, 'and').length).toBe(2);
    });

    it('returns empty when no match', () => {
      expect(filterByQuery(words, 'xyz')).toEqual([]);
    });
  });
});
