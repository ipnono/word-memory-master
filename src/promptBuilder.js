// Builds the {system, user} message pair sent to the LLM.
//
// Slice #2: basic shape only — system = settings.promptTemplate,
//           user = "请处理以下单词：{word}".
// Slice #3 will append the JSON schema to the system message.
// Slice #7 will inject history into the user message when non-empty.

export function buildMessages({ word, history, isFirstWord, settings }) {
  const system = settings.promptTemplate;
  const user = `请处理以下单词：${word}`;
  return { system, user };
}
