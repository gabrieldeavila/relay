import type { CaptionChunk } from './group-caption-chunks.js';

/** Shortest time a caption stays up, so a quick word can still be read. */
const MIN_SECONDS = 0.3;
/** Gaps shorter than this are bridged so captions don't flicker off and on. */
const BRIDGE_SECONDS = 0.5;

/**
 * Timeline-ready caption times: each one lasts at least MIN_SECONDS, holds
 * until the next when the gap is short, and never overlaps the next.
 */
export function holdCaptions(chunks: CaptionChunk[]): CaptionChunk[] {
  return chunks.map((chunk, i) => {
    const next = chunks[i + 1];
    let end = Math.max(chunk.end, chunk.start + MIN_SECONDS);
    if (next && next.start - end < BRIDGE_SECONDS) end = next.start;
    if (next) end = Math.min(end, next.start);
    return { ...chunk, end: Math.max(end, chunk.start + 0.05) };
  });
}
