import type { TimedWord } from './transcript.js';

/** Caption times are rounded to milliseconds; this absorbs it. */
const EPSILON = 0.005;

/**
 * The words starting between `from` and `to` (source seconds) replaced by the
 * words of `rewrite(oldText)`. Kept words keep their times; when the count
 * changes, the last old word's time is shared by the extra words, or
 * stretched over the removed ones. Unchanged when no word is in the range.
 */
export function rewriteTranscriptWords(
  words: TimedWord[],
  from: number,
  to: number,
  rewrite: (oldText: string) => string,
): TimedWord[] {
  const first = words.findIndex((w) => w.start >= from - EPSILON);
  if (first === -1 || words[first].start >= to - EPSILON) return words;
  let end = first;
  while (end < words.length && words[end].start < to - EPSILON) end++;
  const old = words.slice(first, end);
  const texts = splitWords(rewrite(old.map((w) => w.text).join(' ')));
  if (texts.length === 0) throw new Error('The new text has no words.');
  return [...words.slice(0, first), ...retime(old, texts), ...words.slice(end)];
}

function retime(old: TimedWord[], texts: string[]): TimedWord[] {
  const kept = Math.min(old.length, texts.length) - 1;
  const lastStart = old[kept].start;
  const lastEnd = old.at(-1)!.end;
  const share = (lastEnd - lastStart) / (texts.length - kept);
  return texts.map((text, i) =>
    i < kept
      ? { ...old[i], text }
      : {
          text,
          start: round(lastStart + share * (i - kept)),
          end: round(
            i === texts.length - 1
              ? lastEnd
              : lastStart + share * (i - kept + 1),
          ),
        },
  );
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

const round = (seconds: number) => Math.round(seconds * 1000) / 1000;
