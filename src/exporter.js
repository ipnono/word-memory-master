// Backup / restore for the entire localStorage state.
//
// exportAll(): returns {version: 1, exportedAt, settings, words}.
// importAll(json): validates shape, replaces localStorage, returns {ok, errors?}.

import { getSettings, getWords } from './storage.js';

const VERSION = 1;

export function exportAll() {
  return {
    version: VERSION,
    exportedAt: Date.now(),
    settings: getSettings(),
    words: getWords(),
  };
}

export function importAll(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['root:not-object'] };
  }
  if (data.version !== VERSION) errors.push('version:mismatch');
  if (!data.settings || typeof data.settings !== 'object') errors.push('settings:not-object');
  if (!Array.isArray(data.words)) errors.push('words:not-array');

  if (errors.length) return { ok: false, errors };

  // Replace localStorage state atomically.
  globalThis.localStorage.setItem('settings', JSON.stringify(data.settings));
  globalThis.localStorage.setItem('words', JSON.stringify(data.words));
  return { ok: true };
}
