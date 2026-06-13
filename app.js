// App entry. Wires DOM events to the modules.
//
// Layout: 3-column (left = selected-day word list, center = lookup + card,
// right = date sidebar). Adding a word snaps selection to today; deleting
// the last word of a date removes that date from the sidebar automatically.

import { getSettings, getWords, addWord, deleteWord, getDateKey } from './src/storage.js';
import { buildMessages } from './src/promptBuilder.js';
import { complete } from './src/llmClient.js';
import { renderCard } from './src/cardRenderer.js';
import { bindSettingsToggle } from './src/settingsPanel.js';
import { recentN, groupByDate, filterByQuery } from './src/historyIndex.js';

let selectedDateKey = getDateKey(Date.now());

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

  ensureSelectionValid();
  renderLayout();
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
    selectedDateKey = getDateKey(Date.now());
    renderLayout({ scrollToSelected: true });
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

function ensureSelectionValid() {
  const all = getWords();
  if (all.some(w => getDateKey(w.addedAt) === selectedDateKey)) return;
  const groups = groupByDate(all);
  for (const k of ['Today', 'Yesterday', 'ThisWeek', 'Earlier']) {
    if (groups[k].length) {
      selectedDateKey = getDateKey(groups[k][0].addedAt);
      return;
    }
  }
  selectedDateKey = getDateKey(Date.now());
}

function renderLayout({ scrollToSelected = false } = {}) {
  renderDateSidebar({ scrollToSelected });
  renderDayList();
}

function renderDateSidebar({ scrollToSelected = false } = {}) {
  const ul = document.getElementById('date-list');
  ul.innerHTML = '';
  const all = getWords();
  const groups = groupByDate(all);

  const sections = [
    { key: 'Today',     label: '今天' },
    { key: 'Yesterday', label: '昨天' },
    { key: 'ThisWeek',  label: '本周' },
    { key: 'Earlier',   label: '更早' },
  ];

  let selectedLi = null;
  for (const { key, label } of sections) {
    if (!groups[key].length) continue;

    const groupLabel = document.createElement('li');
    groupLabel.className = 'date-group-label';
    groupLabel.textContent = label;
    ul.appendChild(groupLabel);

    for (const entry of groups[key]) {
      const dk = getDateKey(entry.addedAt);
      const li = document.createElement('li');
      if (dk === selectedDateKey) {
        li.classList.add('selected');
        selectedLi = li;
      }

      const dateText = document.createElement('span');
      dateText.textContent = formatDateLabel(dk);
      li.appendChild(dateText);

      const count = document.createElement('span');
      count.className = 'date-count';
      count.textContent = countWordsForDate(all, dk);
      li.appendChild(count);

      li.addEventListener('click', () => {
        if (selectedDateKey === dk) return;
        selectedDateKey = dk;
        renderLayout();
      });
      ul.appendChild(li);
    }
  }

  if (selectedLi && scrollToSelected) {
    selectedLi.scrollIntoView({ block: 'nearest' });
  }
}

function renderDayList() {
  const titleEl = document.getElementById('day-list-title');
  const ul = document.getElementById('day-list-items');
  const emptyEl = document.getElementById('day-list-empty');
  ul.innerHTML = '';

  titleEl.textContent = formatDateTitle(selectedDateKey);

  const all = getWords();
  const todays = all
    .filter(w => getDateKey(w.addedAt) === selectedDateKey)
    .sort((a, b) => b.addedAt - a.addedAt);

  if (todays.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

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
        const stillHas = getWords().some(w => getDateKey(w.addedAt) === selectedDateKey);
        if (!stillHas) {
          ensureSelectionValid();
        }
        renderLayout({ scrollToSelected: true });
      }
    });
    li.appendChild(delBtn);

    ul.appendChild(li);
  }
}

function countWordsForDate(words, dateKey) {
  let n = 0;
  for (const w of words) if (getDateKey(w.addedAt) === dateKey) n++;
  return n;
}

function formatDateLabel(dateKey) {
  const today = getDateKey(Date.now());
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDateKey(d.getTime()); })();
  if (dateKey === today) return '今天';
  if (dateKey === yest)  return '昨天';
  return dateKey;
}

function formatDateTitle(dateKey) {
  const today = getDateKey(Date.now());
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDateKey(d.getTime()); })();
  if (dateKey === today) return '今天';
  if (dateKey === yest)  return '昨天';
  return dateKey;
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
      span.addEventListener('click', () => {
        selectedDateKey = getDateKey(entry.addedAt);
        renderLayout({ scrollToSelected: true });
        document.getElementById('history-view').classList.add('hidden');
        openCard(entry);
      });
      li.appendChild(span);
      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '🗑';
      del.title = `删除 "${entry.card.word}"`;
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`删除 "${entry.card.word}"?`)) {
          deleteWord(entry.id);
          const stillHas = getWords().some(w => getDateKey(w.addedAt) === selectedDateKey);
          if (!stillHas) ensureSelectionValid();
          renderLayout({ scrollToSelected: true });
          render();
        }
      });
      li.appendChild(del);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    container.appendChild(section);
  }
}
