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
import { recentN, groupByDate, filterByQuery } from './src/historyIndex.js';

function init() {
  bindSettingsToggle('settings-btn', 'settings-close', 'settings-panel');
  bindHistoryToggle('history-btn', 'history-close', 'history-view', 'history-search', 'history-groups');

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

  let result;
  try {
    const settings = getSettings();
    const allWords = getWords();
    const history = recentN(allWords, settings.historySize ?? 30);
    const { system, user } = buildMessages({
      word,
      history,
      isFirstWord: allWords.length === 0,
      settings,
    });
    console.log('[wmm] request', { url: settings.apiBaseUrl, model: settings.model, useProxy: settings.useProxy });
    result = await complete({ systemMsg: system, userMsg: user, settings });
    console.log('[wmm] result', result);
  } catch (err) {
    console.error('[wmm] handleLookup threw', err);
    result = { ok: false, error: `JS error: ${err?.message ?? err}` };
  }

  loading.classList.add('hidden');
  input.disabled = false;

  if (result.ok) {
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
    errorMessage.textContent = result.error ?? '未知错误';
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

function bindHistoryToggle(openBtnId, closeBtnId, viewId, searchId, groupsId) {
  const openBtn = document.getElementById(openBtnId);
  const closeBtn = document.getElementById(closeBtnId);
  const view = document.getElementById(viewId);
  const search = document.getElementById(searchId);
  const groupsEl = document.getElementById(groupsId);

  const render = () => {
    const q = search.value;
    const all = getWords();
    const filtered = filterByQuery(all, q);
    const groups = groupByDate(filtered);
    renderGroups(groupsEl, groups);
  };

  const open = () => { render(); view.classList.remove('hidden'); };
  const close = () => view.classList.add('hidden');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  search.addEventListener('input', render);
}

function renderGroups(container, groups) {
  container.innerHTML = '';
  const labels = [
    ['Today',     '今天'],
    ['Yesterday', '昨天'],
    ['ThisWeek',  '本周'],
    ['Earlier',   '更早'],
  ];
  for (const [key, label] of labels) {
    const items = groups[key];
    if (!items.length) continue;
    const section = document.createElement('div');
    section.className = 'history-group';
    section.appendChild(Object.assign(document.createElement('h3'), { textContent: label }));
    const ul = document.createElement('ul');
    for (const entry of items) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = entry.card.word;
      span.addEventListener('click', () => openCard(entry));
      li.appendChild(span);
      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '🗑';
      del.title = `删除 "${entry.card.word}"`;
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`删除 "${entry.card.word}"?`)) {
          deleteWord(entry.id);
          renderGroups(container, groupByDate(filterByQuery(getWords(), document.getElementById('history-search').value)));
          renderTodayList();
        }
      });
      li.appendChild(del);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}
