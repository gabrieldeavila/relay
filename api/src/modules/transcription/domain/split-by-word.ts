import type { CaptionChunk } from './group-caption-chunks.js';

/** The chunk's text while one of its words is being said. */
export interface WordStep {
  text: string;
  start: number;
  end: number;
  /** 0-based index of the spoken word in `text`. */
  word: number;
}

/**
 * One step per word, each lasting until the next word starts, so a highlight
 * moves along the caption with the voice. The first step starts with the
 * chunk and the last holds until it ends; steps too short to see are dropped.
 */
export function splitByWord(chunk: CaptionChunk): WordStep[] {
  const { words } = chunk;
  return words
    .map((word, i) => ({
      text: chunk.text,
      word: i,
      start: i === 0 ? chunk.start : word.start,
      end: i + 1 < words.length ? words[i + 1].start : chunk.end,
    }))
    .filter((step) => step.end - step.start > 0.02);
}
