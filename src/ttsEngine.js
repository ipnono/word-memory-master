// Browser SpeechSynthesis wrapper.
//
// speak(text, opts): cancels any in-flight utterance first to avoid
//                    overlap, then speaks with voice/rate/pitch applied.
// pickVoice(lang): returns first SpeechSynthesisVoice whose lang starts
//                  with the requested tag, or null if none match.

export function speak(text, opts = {}) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (opts.voice) utterance.voice = opts.voice;
  if (opts.rate != null) utterance.rate = opts.rate;
  if (opts.pitch != null) utterance.pitch = opts.pitch;
  speechSynthesis.speak(utterance);
}

export function pickVoice(lang) {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices() ?? [];
  return voices.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase())) ?? null;
}
