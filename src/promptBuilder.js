// Builds the {system, user} message pair sent to the LLM.
//
// Slice #2: basic shape — system = promptTemplate, user = "请处理以下单词：{word}".
// Slice #3: append JSON schema instruction to system.
// Slice #7: inject history block into user when non-empty.

const JSON_SCHEMA_INSTRUCTION = `

## 输出格式（严格 JSON）
请仅返回以下结构的 JSON 对象，不要使用 markdown 代码块包裹，不要有任何前后解释文字：

{
  "word": "<英文单词>",
  "phonetic": "<IPA 音标>",
  "cefr": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "coreMeaning": "<中文核心含义>",
  "etymology": {
    "rootAffix": "<词根/前缀/后缀拆解>",
    "relatedWords": ["<同词根单词1>", "..."],
    "logic": "<为什么这个组合代表这个意思>"
  },
  "mnemonic": { "association": "<记忆钩子：一段生动的话或视觉描述>" },
  "usage": {
    "collocations": ["<搭配1>", "<搭配2>", "<搭配3>"],
    "examples": [
      { "type": "daily",    "en": "<英文>", "zh": "<中文>" },
      { "type": "academic", "en": "<英文>", "zh": "<中文>" }
    ]
  },
  "quiz":   { "question": "<自测题>", "answer": "<答案>" },
  "chain":  "<把以往学过的单词串联进一个句子的设计>"
}`;

function formatHistoryLine(entry) {
  return entry.coreMeaning ? `${entry.word} (${entry.coreMeaning})` : entry.word;
}

export function buildMessages({ word, history, isFirstWord, settings }) {
  const system = `${settings.promptTemplate}${JSON_SCHEMA_INSTRUCTION}`;
  let user = `请处理以下单词：${word}`;

  if (!isFirstWord && Array.isArray(history) && history.length > 0) {
    const lines = history.map(formatHistoryLine).join('\n');
    user += `\n\n用户已学过的最近单词（用于"大串联"）：\n${lines}\n\n请在 chain 字段中把这些单词编织进一个连贯的句子。`;
  }

  return { system, user };
}
