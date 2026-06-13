// App entry. Wires DOM events to the modules.
//
// Slice #2: lookup word → build messages → call LLM → render raw text.
// Slice #3 will parse JSON + render structured card.
// Slice #4 will auto-save to history.

import { getSettings } from './src/storage.js';
import { buildMessages } from './src/promptBuilder.js';
import { complete } from './src/llmClient.js';
import { bindSettingsToggle } from './src/settingsPanel.js';

function init() {
  bindSettingsToggle('settings-btn', 'settings-close', 'settings-panel');

  const form = document.querySelector('.lookup');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = document.getElementById('word-input').value.trim();
    if (!word) return;
    handleLookup(word);
  });
}

async function handleLookup(word) {
  const input = document.getElementById('word-input');
  const loading = document.getElementById('loading');
  const cardArea = document.getElementById('card-area');
  const errorArea = document.getElementById('error-area');
  const errorMessage = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');

  // Reset UI state
  cardArea.classList.add('hidden');
  errorArea.classList.add('hidden');
  cardArea.innerHTML = '';
  errorMessage.textContent = '';

  // Show loading, disable input
  loading.classList.remove('hidden');
  input.disabled = true;

  const settings = getSettings();
  const { system, user } = buildMessages({
    word,
    history: [],
    isFirstWord: true,
    settings,
  });

  const result = await complete({ systemMsg: system, userMsg: user, settings });

  // Hide loading, re-enable input
  loading.classList.add('hidden');
  input.disabled = false;

  if (result.ok) {
    // Slice #3 will replace this with structured rendering + JSON parsing.
    cardArea.classList.remove('hidden');
    const pre = document.createElement('pre');
    pre.textContent = result.text;
    cardArea.appendChild(pre);
  } else {
    errorArea.classList.remove('hidden');
    errorMessage.textContent = result.error;
    retryBtn.onclick = () => handleLookup(word);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
