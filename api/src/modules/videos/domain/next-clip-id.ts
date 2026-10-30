import type { Timeline } from './timeline-types.js';

/** `clip_<highest number + 1>`, so ids are short and predictable for the AI. */
export function nextClipId(timeline: Timeline, taken: string[] = []): string {
  const numbers = [...timeline.clips.map((clip) => clip.id), ...taken]
    .map((id) => /^clip_(\d+)$/.exec(id)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  return `clip_${Math.max(0, ...numbers) + 1}`;
}

/** Hands out fresh ids one after another, for edits that add several clips. */
export function clipIdSequence(timeline: Timeline): () => string {
  const taken: string[] = [];
  return () => {
    const id = nextClipId(timeline, taken);
    taken.push(id);
    return id;
  };
}
