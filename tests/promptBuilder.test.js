import { describe, it, expect } from 'vitest';
import { buildMessages } from '../src/promptBuilder.js';

describe('promptBuilder', () => {
  describe('buildMessages', () => {
    it('uses settings.promptTemplate as the system message and preserves it verbatim', () => {
      const settings = { promptTemplate: 'YOU ARE A WORD MEMORY MASTER.' };
      const { system, user } = buildMessages({
        word: 'abandon',
        history: [],
        isFirstWord: true,
        settings,
      });
      expect(system).toContain('YOU ARE A WORD MEMORY MASTER.');
      expect(user).toContain('abandon');
    });

    it('returns the shape {system, user}', () => {
      const result = buildMessages({
        word: 'meticulous',
        history: [],
        isFirstWord: true,
        settings: { promptTemplate: 'P' },
      });
      expect(Object.keys(result).sort()).toEqual(['system', 'user']);
    });

    describe('slice #3 — JSON schema appended to system', () => {
      it('appends a JSON schema instruction listing required field names', () => {
        const { system } = buildMessages({
          word: 'abandon',
          history: [],
          isFirstWord: true,
          settings: { promptTemplate: 'BASE' },
        });
        // Spot-check the major fields the schema requires
        for (const key of ['word', 'phonetic', 'cefr', 'coreMeaning',
                           'etymology', 'mnemonic', 'usage', 'quiz', 'chain']) {
          expect(system).toContain(key);
        }
      });

      it('instructs the model to return raw JSON without markdown fences', () => {
        const { system } = buildMessages({
          word: 'x',
          history: [],
          isFirstWord: true,
          settings: { promptTemplate: 'BASE' },
        });
        // Must tell model not to wrap in ```json```
        expect(system).toMatch(/不要.*markdown|无 markdown|不要.*代码块/);
      });
    });
  });
});
