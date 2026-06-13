import { describe, it, expect } from 'vitest';
import { buildMessages } from '../src/promptBuilder.js';

describe('promptBuilder', () => {
  describe('buildMessages (slice #2 — basic shape, no JSON schema, no history)', () => {
    it('uses settings.promptTemplate as the system message', () => {
      const settings = { promptTemplate: 'YOU ARE A WORD MEMORY MASTER.' };
      const { system, user } = buildMessages({
        word: 'abandon',
        history: [],
        isFirstWord: true,
        settings,
      });
      expect(system).toBe('YOU ARE A WORD MEMORY MASTER.');
    });

    it('includes the word in the user message', () => {
      const settings = { promptTemplate: 'X' };
      const { user } = buildMessages({
        word: 'ephemeral',
        history: [],
        isFirstWord: true,
        settings,
      });
      expect(user).toContain('ephemeral');
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
  });
});
