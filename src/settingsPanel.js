// Settings panel UI. Renders editable fields and persists via storage.
//
// Slice #1: 5 fields (apiBaseUrl, apiKey, model, promptTemplate, historySize).
// Slice #5: + voice, rate, pitch (TTS).
// Slice #10: + useProxy, proxyUrl, export/import buttons.

import { getSettings, setSettings, DEFAULT_SETTINGS } from './storage.js';

const FIELDS = [
  { key: 'apiBaseUrl',     label: 'API Base URL',        type: 'text' },
  { key: 'apiKey',         label: 'API Key',             type: 'text' },
  { key: 'model',          label: 'Model',               type: 'text' },
  { key: 'promptTemplate', label: 'Prompt Template',     type: 'textarea' },
  { key: 'historySize',    label: 'History injection N', type: 'number' },
  { key: 'voice',          label: 'TTS Voice',           type: 'voice' },
  { key: 'rate',           label: 'TTS Rate',            type: 'range', min: 0.5, max: 2, step: 0.1 },
  { key: 'pitch',          label: 'TTS Pitch',           type: 'range', min: 0.5, max: 2, step: 0.1 },
];

export function renderSettings(container) {
  const current = getSettings();
  container.innerHTML = '';
  for (const field of FIELDS) {
    container.appendChild(buildFieldRow(field, current[field.key]));
  }
}

function buildFieldRow(field, value) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.dataset.key = field.key;

  const label = document.createElement('label');
  label.textContent = field.label;
  label.htmlFor = `field-${field.key}`;
  row.appendChild(label);

  const control = document.createElement('div');
  control.className = 'field-control';

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 8;
    input.value = value ?? '';
    input.addEventListener('change', () => setSettings({ [field.key]: input.value }));
  } else if (field.type === 'voice') {
    input = buildVoiceSelect(value);
    input.addEventListener('change', () => setSettings({ [field.key]: input.value }));
  } else if (field.type === 'range') {
    input = document.createElement('input');
    input.type = 'range';
    input.min = field.min;
    input.max = field.max;
    input.step = field.step;
    input.value = value ?? 1.0;
    input.addEventListener('change', () => setSettings({ [field.key]: Number(input.value) }));
  } else {
    input = document.createElement('input');
    input.type = field.type;
    if (field.type === 'number') input.min = '1';
    input.value = value ?? '';
    input.addEventListener('change', () => {
      const v = field.type === 'number' ? Number(input.value) : input.value;
      setSettings({ [field.key]: v });
    });
  }
  input.id = `field-${field.key}`;
  control.appendChild(input);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.textContent = '恢复默认';
  resetBtn.addEventListener('click', () => {
    const def = DEFAULT_SETTINGS[field.key];
    input.value = def ?? '';
    setSettings({ [field.key]: def });
  });
  control.appendChild(resetBtn);

  row.appendChild(control);
  return row;
}

function buildVoiceSelect(currentValue) {
  const sel = document.createElement('select');
  // Default option: en-US lang fallback
  const def = document.createElement('option');
  def.value = '';
  def.textContent = '默认 (en-US)';
  sel.appendChild(def);

  const populate = () => {
    // Remove voice options but keep the default
    while (sel.options.length > 1) sel.remove(1);
    if (typeof speechSynthesis === 'undefined') return;
    const voices = speechSynthesis.getVoices() ?? [];
    for (const v of voices) {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang})`;
      sel.appendChild(opt);
    }
    sel.value = currentValue ?? '';
  };

  populate();
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener?.('voiceschanged', populate);
  }
  return sel;
}

export function bindSettingsToggle(openBtnId, closeBtnId, panelId) {
  const openBtn = document.getElementById(openBtnId);
  const closeBtn = document.getElementById(closeBtnId);
  const panel = document.getElementById(panelId);
  const container = panel.querySelector('#settings-fields');

  const open = () => {
    renderSettings(container);
    panel.classList.remove('hidden');
  };
  const close = () => panel.classList.add('hidden');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });
}
