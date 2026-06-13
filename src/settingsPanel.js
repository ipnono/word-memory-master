// Settings panel UI. Renders editable fields for the user's configuration
// and persists changes via storage.setSettings. Per-field reset-to-default.
//
// Slice #1 covers the 5 fields needed for the very first lookup flow.
// Additional fields (voice / rate / pitch / useProxy / proxyUrl) are
// added in their respective slices.

import { getSettings, setSettings, DEFAULT_SETTINGS } from './storage.js';

// Fields rendered in the settings panel for slice #1.
const FIELDS = [
  { key: 'apiBaseUrl',   label: 'API Base URL',         type: 'text' },
  { key: 'apiKey',       label: 'API Key',              type: 'text' },
  { key: 'model',        label: 'Model',                type: 'text' },
  { key: 'promptTemplate', label: 'Prompt Template',    type: 'textarea' },
  { key: 'historySize',  label: 'History injection N',  type: 'number' },
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
  } else {
    input = document.createElement('input');
    input.type = field.type;
    if (field.type === 'number') input.min = '1';
  }
  input.id = `field-${field.key}`;
  input.value = value ?? '';
  input.addEventListener('change', () => {
    const v = field.type === 'number' ? Number(input.value) : input.value;
    setSettings({ [field.key]: v });
  });
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
