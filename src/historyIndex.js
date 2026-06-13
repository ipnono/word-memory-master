// Pure functions over the words[] array. No side effects.
//
// Slice #7: recentN (used for chain injection).
// Slice #8: groupByDate + filterByQuery (history navigation).

export function recentN(words, n) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt);
  return sorted.slice(0, n).map(w => {
    const out = { word: w.card.word };
    if (w.card.coreMeaning) out.coreMeaning = w.card.coreMeaning;
    return out;
  });
}
