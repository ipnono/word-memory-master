// App entry. Wires DOM events to the modules.
//
// Slice #2: lookup → LLM → raw text.
// Slice #3: JSON parse + structured card render.
// Slice #4: auto-save validated card + today's words list.

import { getSettings, getWords, addWord, deleteWord } from './src/storage.js';
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

  renderTodayList();
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
  errorArea.querySelectorAll('pre').forEach(p => p.remove());

  loading.classList.remove('hidden');
  input.disabled = true;

  const settings = getSettings();
  const { system, user } = buildMessages({
    word,
    history: [],
    isFirstWord: getWords().length === 0,
    settings,
  });

  const result = await complete({ systemMsg: system, userMsg: user, settings });

  loading.classList.add('hidden');
  input.disabled = false;

  if (result.ok) {
    // Auto-save on success.
    const entry = {
      id: crypto.randomUUID(),
      addedAt: Date.now(),
      card: result.card,
    };
    addWord(entry);
    openCard(entry);
    renderTodayList();
  } else if (result.raw != null) {
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

function openCard(entry) {
  const cardArea = document.getElementById('card-area');
  cardArea.innerHTML = '';
  cardArea.classList.remove('hidden');
  cardArea.appendChild(renderCard(entry.card, entry));
}

function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
}

function renderTodayList() {
  const list = document.getElementById('today-list');
  const ul = document.getElementById('today-list-items');
  ul.innerHTML = '';

  const todays = getWords().filter(w => isToday(w.addedAt));
  if (todays.length === 0) {
    list.classList.add('hidden');
    return;
  }
  list.classList.remove('hidden');

  // Sort newest first
  todays.sort((a, b) => b.addedAt - a.addedAt);

  for (const entry of todays) {
    const li = document.createElement('li');

    const wordSpan = document.createElement('span');
    wordSpan.textContent = entry.card.word;
    wordSpan.addEventListener('click', () => openCard(entry));
    li.appendChild(wordSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '🗑';
    delBtn.title = `删除 "${entry.card.word}"`;
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`删除 "${entry.card.word}"?`)) {
        deleteWord(entry.id);
        renderTodayList();
      }
    });
    li.appendChild(delBtn);

    ul.appendChild(li);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
