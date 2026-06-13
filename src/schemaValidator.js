// Validates LLM-returned JSON against the canonical card schema.
// Returns {ok: true, card} on success, {ok: false, errors[]} on failure.
//
// Schema (from PRD): word, phonetic, cefr, coreMeaning,
//   etymology {rootAffix, relatedWords[], logic},
//   mnemonic {association},
//   usage {collocations[], examples[{type,en,zh}]},
//   quiz {question, answer},
//   chain (optional).

export function validateCard(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { ok: false, errors: ['root:not-object'] };
  }

  if (typeof obj.word !== 'string' || !obj.word) errors.push('word');
  if (typeof obj.phonetic !== 'string' || !obj.phonetic) errors.push('phonetic');
  if (typeof obj.coreMeaning !== 'string' || !obj.coreMeaning) errors.push('coreMeaning');

  if (obj.etymology && typeof obj.etymology === 'object') {
    if (!Array.isArray(obj.etymology.relatedWords) ||
        !obj.etymology.relatedWords.every(x => typeof x === 'string')) {
      errors.push('etymology.relatedWords:not-string-array');
    }
  }

  if (obj.usage && typeof obj.usage === 'object') {
    if (!Array.isArray(obj.usage.examples)) errors.push('usage.examples:not-array');
  }

  if (obj.quiz && typeof obj.quiz === 'object') {
    if (typeof obj.quiz.question !== 'string' || !obj.quiz.question) {
      errors.push('quiz.question:empty');
    }
  }

  // chain is optional

  if (errors.length) return { ok: false, errors };
  return { ok: true, card: obj };
}
