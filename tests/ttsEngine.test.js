import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speak, pickVoice } from '../src/ttsEngine.js';

function makeMockSpeechSynthesis() {
  return {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [
      { name: 'Microsoft Aria - English (US)', lang: 'en-US' },
      { name: 'Microsoft Jenny - English (US)', lang: 'en-US' },
      { name: 'Microsoft Xiaoxiao - Chinese', lang: 'zh-CN' },
    ]),
    speaking: false,
  };
}

describe('ttsEngine', () => {
  let mockSS;

  beforeEach(() => {
    mockSS = makeMockSpeechSynthesis();
    globalThis.SpeechSynthesisUtterance = vi.fn(function (text) {
      this.text = text;
      this.voice = null;
      this.rate = 1;
      this.pitch = 1;
      this.lang = '';
    });
    globalThis.speechSynthesis = mockSS;
  });

  afterEach(() => {
    delete globalThis.speechSynthesis;
    delete globalThis.SpeechSynthesisUtterance;
  });

  describe('speak', () => {
    it('cancels any in-flight speech before speaking (avoids overlap)', () => {
      speak('hello');
      expect(mockSS.cancel).toHaveBeenCalledTimes(1);
      expect(mockSS.speak).toHaveBeenCalledTimes(1);
    });

    it('creates an utterance with the given text', () => {
      speak('abandon');
      const utterance = mockSS.speak.mock.calls[0][0];
      expect(utterance.text).toBe('abandon');
    });

    it('applies voice / rate / pitch from opts', () => {
      const voice = { name: 'Aria', lang: 'en-US' };
      speak('hello', { voice, rate: 0.8, pitch: 1.5 });
      const utterance = mockSS.speak.mock.calls[0][0];
      expect(utterance.voice).toBe(voice);
      expect(utterance.rate).toBe(0.8);
      expect(utterance.pitch).toBe(1.5);
    });
  });

  describe('pickVoice', () => {
    it('returns the first voice whose lang starts with the requested tag', () => {
      const voice = pickVoice('en-US');
      expect(voice).toBeTruthy();
      expect(voice.lang).toMatch(/^en-US/);
    });

    it('returns null when no voice matches', () => {
      const voice = pickVoice('xx-XX');
      expect(voice).toBeNull();
    });
  });
});
