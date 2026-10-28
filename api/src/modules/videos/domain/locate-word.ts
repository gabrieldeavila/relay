/** Where a word sits in laid-out lines: its line and the text before it on that line. */
export interface WordLocation {
  line: number;
  before: string;
  word: string;
}

/** Number of words in a text, split on spaces and line breaks. */
export const countWords = (text: string) => text.match(/\S+/g)?.length ?? 0;

/** Finds the `index`-th word (0-based) across lines; null when there is none. */
export function locateWord(
  lines: string[],
  index: number,
): WordLocation | null {
  let remaining = index;
  for (const [line, text] of lines.entries()) {
    for (const match of text.matchAll(/\S+/g)) {
      if (remaining-- === 0) {
        return { line, before: text.slice(0, match.index), word: match[0] };
      }
    }
  }
  return null;
}
