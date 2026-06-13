// OpenAI-compatible chat completions client.
//
// Slice #2: basic POST + response text extraction.
// Slice #3: JSON parse + schema validation.
// Slice #9: retry-once-with-stricter-suffix on JSON parse failure.
// Slice #10: proxy routing.

import { validateCard } from './schemaValidator.js';

const STRICT_JSON_SUFFIX = '\n\n重要：仅返回原始 JSON 对象，不要使用 markdown 代码块包裹，不要有任何前后解释文字。';

function stripMarkdownFences(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text.trim();
}

function buildRequest({ systemMsg, userMsg, settings }) {
  return {
    url: `${settings.apiBaseUrl}/chat/completions`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey ?? ''}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
      }),
    },
  };
}

async function postAndExtract({ systemMsg, userMsg, settings }) {
  const { url, init } = buildRequest({ systemMsg, userMsg, settings });
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
  if (!res.ok) {
    return { ok: false, error: `${res.status} ${res.statusText}` };
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const stripped = stripMarkdownFences(text);
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { ok: false, raw: text, parseFailed: true };
  }
  const validated = validateCard(parsed);
  if (validated.ok) return { ok: true, card: validated.card };
  return { ok: false, raw: text, parseFailed: true };
}

export async function complete({ systemMsg, userMsg, settings }) {
  const first = await postAndExtract({ systemMsg, userMsg, settings });
  if (first.ok) return first;
  if (!first.parseFailed) return first; // network/HTTP error — no retry
  if (first.error) return first; // safety

  // Retry once with stricter suffix on the user message.
  const second = await postAndExtract({
    systemMsg,
    userMsg: `${userMsg}${STRICT_JSON_SUFFIX}`,
    settings,
  });
  return second;
}
