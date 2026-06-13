// OpenAI-compatible chat completions client.
//
// Slice #2: basic POST + response text extraction.
// Slice #3: JSON parse + schema validation. Returns {ok:true, card} on
//           success or {ok:false, raw} on parse/validation failure.
// Slice #9 will add JSON retry-with-stricter-prompt.
// Slice #10 will add proxy routing.

import { validateCard } from './schemaValidator.js';

function stripMarkdownFences(text) {
  // ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text.trim();
}

export async function complete({ systemMsg, userMsg, settings }) {
  const url = `${settings.apiBaseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.apiKey ?? ''}`,
  };
  const body = {
    model: settings.model,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ],
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
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
    return { ok: false, raw: text };
  }

  const validated = validateCard(parsed);
  if (validated.ok) return { ok: true, card: validated.card };
  return { ok: false, raw: text };
}
