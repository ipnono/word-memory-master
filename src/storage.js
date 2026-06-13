// Local storage wrapper for settings + word history.
// All persistence is via globalThis.localStorage (works in both browser
// and Node tests; in the browser, window.localStorage === globalThis.localStorage).

const SETTINGS_KEY = 'settings';
const WORDS_KEY = 'words';

export const DEFAULT_SETTINGS = Object.freeze({
  apiBaseUrl: 'https://api.MiniMax.chat/v1',
  apiKey: '',
  model: 'MiniMax-M3',
  promptTemplate: `你是一名融合了语言学专家、认知心理学家（专注于记忆科学）和创意作家能力的"英语单词记忆大师"。你擅长将枯燥的单词转化为生动、易读且符合大脑记忆规律的结构化信息。\n\n## 背景\n用户希望快速掌握特定英文单词。\n\n## 行为与规则\n1. [语言学专家]：拆解词根/前缀/后缀，解释词源（如有）。\n2. [记忆专家]：设计视觉化故事或谐音联想，提供记忆钩子。\n3. [创意作家]：提供 2 个例句（日常 + 学术），列出 3 个常见搭配。\n4. [逻辑专家]：在最后生成一个即时测试题目。\n\n## 约束\n- 严禁幻觉，没有明确词根就直接说明。\n- 简洁，记忆点直击痛点。\n- 难度适配：默认采用 CEFR 标准 (A1-C2)。\n- 语言：使用中文解释英文，例句中英双语。\n- 互动：每轮仅处理一个单词。\n\n## 输出格式\n请按以下 Markdown 模板回复每一个单词：\n\n📌 [单词名称] [音标]\n- 难度评级: [A1-C2]\n- 核心含义: [简洁准确的中文定义]\n\n🧬 基因拆解 (Etymology)\n- 词根/缀: ...\n- 同词根单词: ...\n- 内在逻辑: ...\n\n💡 记忆钩子 (Mnemonic)\n- 联想: ...\n\n📝 实战应用 (Usage)\n- 常见搭配: ...\n- 双语例句:\n  1. 日常: ...\n  2. 学术: ...\n\n🧠 大串联\n- [把以往所学的单词来一个串联的句子]`,
  historySize: 30,
  useProxy: false,
  proxyUrl: 'http://localhost:8787/v1',
  voice: 'en-US',
  rate: 1.0,
  pitch: 1.0,
  temperature: 0.7,
  maxTokens: 2000,
  requestTimeoutMs: 30000,
  useJsonMode: true,
});

function getLS() {
  return globalThis.localStorage;
}

export function getSettings() {
  const raw = getLS().getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function setSettings(partial) {
  const current = getSettings();
  const merged = { ...current, ...partial };
  getLS().setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export function getWords() {
  const raw = getLS().getItem(WORDS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function addWord(entry) {
  const words = getWords();
  words.push(entry);
  getLS().setItem(WORDS_KEY, JSON.stringify(words));
  return words;
}

export function deleteWord(id) {
  const words = getWords().filter(w => w.id !== id);
  getLS().setItem(WORDS_KEY, JSON.stringify(words));
  return words;
}
