// Pure functions over the words[] array. No side effects.
//
// Slice #7: recentN.
// Slice #8: groupByDate + filterByQuery.

export function recentN(words, n) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt);
  return sorted.slice(0, n).map(w => {
    const out = { word: w.card.word };
    if (w.card.coreMeaning) out.coreMeaning = w.card.coreMeaning;
    return out;
  });
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function groupByDate(words, now = new Date()) {
  const today = [];
  const yesterday = [];
  const thisWeek = [];
  const earlier = [];

  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6); // 7-day window including today

  for (const w of words) {
    const t = new Date(w.addedAt);
    if (t >= todayStart)      today.push(w);
    else if (t >= yesterdayStart) yesterday.push(w);
    else if (t >= weekStart)  thisWeek.push(w);
    else                      earlier.push(w);
  }

  const sortDesc = (a, b) => b.addedAt - a.addedAt;
  today.sort(sortDesc);
  yesterday.sort(sortDesc);
  thisWeek.sort(sortDesc);
  earlier.sort(sortDesc);

  return { Today: today, Yesterday: yesterday, ThisWeek: thisWeek, Earlier: earlier };
}

export function filterByQuery(words, q) {
  if (!q) return [...words];
  const needle = q.toLowerCase();
  return words.filter(w => (w.card.word ?? '').toLowerCase().includes(needle));
}
