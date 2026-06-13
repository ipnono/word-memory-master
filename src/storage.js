// Local storage wrapper for settings + word history.
// All persistence is via globalThis.localStorage (works in both browser
// and Node tests; in the browser, window.localStorage === globalThis.localStorage).

const SETTINGS_KEY = 'settings';
const WORDS_KEY = 'words';

export const DEFAULT_SETTINGS = Object.freeze({
  apiBaseUrl: 'https://api.MiniMax.chat/v1',
  apiKey: '',
  model: 'MiniMax-M3',
  promptTemplate: '', // populated below
  historySize: 30,
  useProxy: false,
  proxyUrl: 'http://localhost:8787/v1',
  voice: 'en-US',
  rate: 1.0,
  pitch: 1.0,
  temperature: 0.7,
  maxTokens: 2000,
  requestTimeoutMs: 30000,
  useJsonMode: true,
});

function getLS() {
  return globalThis.localStorage;
}

export function getSettings() {
  const raw = getLS().getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function setSettings(partial) {
  const current = getSettings();
  const merged = { ...current, ...partial };
  getLS().setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export function getWords() {
  const raw = getLS().getItem(WORDS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function addWord(entry) {
  const words = getWords();
  words.push(entry);
  getLS().setItem(WORDS_KEY, JSON.stringify(words));
  return words;
}

export function deleteWord(id) {
  const words = getWords().filter(w => w.id !== id);
  getLS().setItem(WORDS_KEY, JSON.stringify(words));
  return words;
}
