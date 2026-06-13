// App entry. Slice #1 wires the minimal shell:
// - settings panel open/close
// - input submit logs to console (LLM call is slice #2)

import { bindSettingsToggle } from './src/settingsPanel.js';

function init() {
  bindSettingsToggle('settings-btn', 'settings-close', 'settings-panel');

  const input = document.getElementById('word-input');
  const form = document.querySelector('.lookup');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = input.value.trim();
    if (!word) return;
    // Slice #2 will replace this with the LLM call.
    console.log('[stub] lookup:', word);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
