import { describe, it, expect } from 'vitest';
import { validateCard } from '../src/schemaValidator.js';

const VALID_CARD = {
  word: 'abandon',
  phonetic: '/əˈbændən/',
  cefr: 'B2',
  coreMeaning: '放弃；抛弃',
  etymology: {
    rootAffix: 'a- (加强) + bandon (权威/控制)',
    relatedWords: ['ban', 'bandage', 'bandit'],
    logic: '放弃对某物的控制权 → 完全放弃',
  },
  mnemonic: { association: '想象你丢掉王冠的瞬间...' },
  usage: {
    collocations: ['abandon hope', 'abandon oneself to', 'abandon ship'],
    examples: [
      { type: 'daily', en: 'He abandoned his car.', zh: '他把车丢了。' },
      { type: 'academic', en: 'The theory was abandoned.', zh: '该理论被摒弃。' },
    ],
  },
  quiz: { question: '填空：He ___ his car.', answer: 'abandoned' },
  chain: 'After he abandoned his post, the bandit tried to bandage his wounds.',
};

describe('schemaValidator', () => {
  it('accepts a fully valid card', () => {
    const result = validateCard(VALID_CARD);
    expect(result.ok).toBe(true);
    expect(result.card.word).toBe('abandon');
  });

  it('rejects when word is missing', () => {
    const { word, ...rest } = VALID_CARD;
    const result = validateCard(rest);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('word');
  });

  it('rejects when phonetic is missing', () => {
    const { phonetic, ...rest } = VALID_CARD;
    const result = validateCard(rest);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('phonetic');
  });

  it('rejects when coreMeaning is missing', () => {
    const { coreMeaning, ...rest } = VALID_CARD;
    const result = validateCard(rest);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('coreMeaning');
  });

  it('rejects when etymology.relatedWords is not a string array', () => {
    const card = structuredClone(VALID_CARD);
    card.etymology.relatedWords = 'ban, bandage, bandit'; // string, not array
    const result = validateCard(card);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/relatedWords/);
  });

  it('rejects when usage.examples is not an array', () => {
    const card = structuredClone(VALID_CARD);
    card.usage.examples = 'not an array';
    const result = validateCard(card);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/examples/);
  });

  it('rejects when quiz.question is empty string', () => {
    const card = structuredClone(VALID_CARD);
    card.quiz.question = '';
    const result = validateCard(card);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/quiz\.question/);
  });

  it('accepts when chain is missing (optional)', () => {
    const { chain, ...rest } = VALID_CARD;
    const result = validateCard(rest);
    expect(result.ok).toBe(true);
  });
});
