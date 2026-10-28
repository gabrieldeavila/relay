import type { TimedWord } from './transcript.js';

/** A few words shown together, with when they are said. */
export interface CaptionChunk {
  text: string;
  start: number;
  end: number;
  /** The words in the chunk, with their own times. */
  words: TimedWord[];
}

export interface ChunkRules {
  maxWords: number;
  maxChars: number;
  /** Seconds of silence that start a new chunk. */
  maxPause: number;
  /** A word matching this ends its chunk (punctuation). */
  breakAfter: RegExp;
}

/** Short CapCut-style captions: 2–3 words, broken at pauses and punctuation. */
export const CAPTION_RULES: ChunkRules = {
  maxWords: 3,
  maxChars: 18,
  maxPause: 0.6,
  breakAfter: /[.!?…,;:]$/,
};

/** Whole sentences, for reading a transcript. */
export const SENTENCE_RULES: ChunkRules = {
  maxWords: 40,
  maxChars: 220,
  maxPause: 1.2,
  breakAfter: /[.!?…]$/,
};

/** Groups words in order into chunks that follow the rules. */
export function groupCaptionChunks(
  words: TimedWord[],
  rules: ChunkRules,
): CaptionChunk[] {
  const groups: TimedWord[][] = [];
  for (const word of words) {
    const current = groups.at(-1);
    if (current && fits(current, word, rules)) current.push(word);
    else groups.push([word]);
  }
  return groups.map(toChunk);
}

function fits(group: TimedWord[], word: TimedWord, rules: ChunkRules) {
  const last = group.at(-1)!;
  if (rules.breakAfter.test(last.text)) return false;
  if (word.start - last.end > rules.maxPause) return false;
  if (group.length >= rules.maxWords) return false;
  return joinWords([...group, word]).length <= rules.maxChars;
}

function toChunk(group: TimedWord[]): CaptionChunk {
  return {
    text: joinWords(group),
    start: group[0].start,
    end: group.at(-1)!.end,
    words: group,
  };
}

const joinWords = (words: TimedWord[]) =>
  words.map((word) => word.text).join(' ');
