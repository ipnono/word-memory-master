// Renders a validated card object as an HTMLElement.
//
// Slice #3: text-only render. No audio buttons yet (slice #5).
// Slice #5 will add 🔊 buttons; slice #6 will add the quiz + rating.

export function renderCard(card) {
  const root = document.createElement('article');
  root.className = 'card';

  root.appendChild(renderHeader(card));
  if (card.etymology) root.appendChild(renderEtymology(card.etymology));
  if (card.mnemonic) root.appendChild(renderMnemonic(card.mnemonic));
  if (card.usage) root.appendChild(renderUsage(card.usage));
  if (card.chain) root.appendChild(renderChain(card.chain));

  return root;
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

function renderHeader(card) {
  const h = el('section', 'card-section card-header');
  h.appendChild(el('h1', 'card-word', card.word));
  const meta = el('div', 'card-meta');
  if (card.phonetic) meta.appendChild(el('span', 'card-phonetic', card.phonetic));
  if (card.cefr) meta.appendChild(el('span', 'card-cefr', card.cefr));
  h.appendChild(meta);
  if (card.coreMeaning) h.appendChild(el('p', 'card-core', card.coreMeaning));
  return h;
}

function renderEtymology(etym) {
  const s = el('section', 'card-section');
  s.appendChild(el('h2', null, '🧬 基因拆解 (Etymology)'));
  if (etym.rootAffix) s.appendChild(el('p', null, `词根/缀: ${etym.rootAffix}`));
  if (Array.isArray(etym.relatedWords) && etym.relatedWords.length) {
    s.appendChild(el('p', null, `同词根单词: ${etym.relatedWords.join(', ')}`));
  }
  if (etym.logic) s.appendChild(el('p', null, `内在逻辑: ${etym.logic}`));
  return s;
}

function renderMnemonic(mn) {
  const s = el('section', 'card-section');
  s.appendChild(el('h2', null, '💡 记忆钩子 (Mnemonic)'));
  if (mn.association) s.appendChild(el('p', null, mn.association));
  return s;
}

function renderUsage(usage) {
  const s = el('section', 'card-section');
  s.appendChild(el('h2', null, '📝 实战应用 (Usage)'));
  if (Array.isArray(usage.collocations) && usage.collocations.length) {
    s.appendChild(el('p', null, `常见搭配: ${usage.collocations.join(', ')}`));
  }
  if (Array.isArray(usage.examples)) {
    const ex = el('div', 'card-examples');
    for (const ex_i of usage.examples) {
      const item = el('div', `card-example card-example-${ex_i.type}`);
      item.appendChild(el('span', 'card-example-tag', ex_i.type === 'daily' ? '日常' : '学术'));
      item.appendChild(el('p', 'card-example-en', ex_i.en ?? ''));
      if (ex_i.zh) item.appendChild(el('p', 'card-example-zh', ex_i.zh));
      ex.appendChild(item);
    }
    s.appendChild(ex);
  }
  return s;
}

function renderChain(chain) {
  const s = el('section', 'card-section card-chain');
  s.appendChild(el('h2', null, '🧠 大串联'));
  s.appendChild(el('p', null, chain));
  return s;
}
