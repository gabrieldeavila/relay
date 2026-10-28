import type { TimedWord, Transcript } from './transcript.js';

/** The parts of whisper-cli's `-ojf` (full JSON) output Relay reads. */
export interface WhisperJson {
  result?: { language?: string };
  transcription: {
    tokens?: { text: string; offsets: { from: number; to: number } }[];
  }[];
}

type WhisperToken = NonNullable<WhisperJson['transcription'][0]['tokens']>[0];

// Control tokens look like "[_BEG_]" or "[_TT_166]".
const CONTROL_TOKEN = /^\[_[^\]]*\]$/;
// Non-speech markers once joined into a word: "[BLANK_AUDIO]", "(music)".
const NON_SPEECH = /^[[(].*[\])]$/;

/**
 * Words with times from whisper's tokens. A token that starts with a space
 * begins a new word; the others (word pieces, punctuation) join the last one.
 */
export function parseWhisperJson(json: WhisperJson): Transcript {
  const tokens = json.transcription.flatMap((segment) => segment.tokens ?? []);
  const words = tokens
    .filter((token) => !CONTROL_TOKEN.test(token.text))
    .reduce<TimedWord[]>(addToken, [])
    .filter((word) => word.text && !NON_SPEECH.test(word.text));
  return { language: json.result?.language ?? 'unknown', words };
}

function addToken(words: TimedWord[], token: WhisperToken): TimedWord[] {
  const start = token.offsets.from / 1000;
  const end = token.offsets.to / 1000;
  const last = words.at(-1);
  if (last && !/^\s/.test(token.text)) {
    return [
      ...words.slice(0, -1),
      { ...last, text: last.text + token.text, end },
    ];
  }
  return [...words, { text: token.text.trim(), start, end }];
}
