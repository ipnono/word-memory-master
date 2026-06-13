// OpenAI-compatible chat completions client.
//
// Slice #2: basic POST + response text extraction. No JSON parsing,
//           no retry, no proxy, no streaming — those are later slices.

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
  return { ok: true, text };
}
