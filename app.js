// App entry. Wires DOM events to the modules.
//
// Slice #2: lookup word → build messages → call LLM → render raw text.
// Slice #3: parse JSON + render structured card.

import { getSettings } from './src/storage.js';
import { buildMessages } from './src/promptBuilder.js';
import { complete } from './src/llmClient.js';
import { renderCard } from './src/cardRenderer.js';
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

  cardArea.classList.add('hidden');
  errorArea.classList.add('hidden');
  cardArea.innerHTML = '';
  errorMessage.textContent = '';

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

  loading.classList.add('hidden');
  input.disabled = false;

  if (result.ok) {
    cardArea.classList.remove('hidden');
    cardArea.appendChild(renderCard(result.card));
  } else if (result.raw != null) {
    // Parse/validation failed — show raw text + retry
    errorArea.classList.remove('hidden');
    errorMessage.textContent = 'LLM 返回的内容无法解析为预期的 JSON 结构。原始内容：';
    const pre = document.createElement('pre');
    pre.textContent = result.raw;
    errorArea.appendChild(pre);
    retryBtn.onclick = () => { errorArea.querySelectorAll('pre').forEach(p => p.remove()); handleLookup(word); };
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
