import { clipEnd } from '../../videos/domain/clip-timing.js';
import type { TextClip, Timeline } from '../../videos/domain/timeline-types.js';

/** auto_captions puts its captions here. */
export const CAPTION_LAYER = 11;

/** Gaps shorter than this still join clips into one phrase. */
const JOIN_GAP = 0.05;

/**
 * One caption as the viewer reads it. With a moving highlight it is several
 * clips in a row (one per spoken word) sharing the same text.
 */
export interface CaptionPhrase {
  text: string;
  start: number;
  end: number;
  clips: TextClip[];
}

/** The captions on a layer, in time order. */
export function captionPhrases(
  timeline: Timeline,
  layer: number,
): CaptionPhrase[] {
  const clips = timeline.clips
    .filter((c): c is TextClip => c.kind === 'text' && c.layer === layer)
    .sort((a, b) => a.start - b.start);
  const phrases: CaptionPhrase[] = [];
  for (const clip of clips) {
    const last = phrases.at(-1);
    if (last && continuesPhrase(last, clip)) {
      last.clips.push(clip);
      last.end = clipEnd(clip);
    } else {
      phrases.push({
        text: clip.text,
        start: clip.start,
        end: clipEnd(clip),
        clips: [clip],
      });
    }
  }
  return phrases;
}

function continuesPhrase(phrase: CaptionPhrase, clip: TextClip): boolean {
  const previous = phrase.clips.at(-1)!;
  return (
    clip.text === phrase.text &&
    Math.abs(clip.start - phrase.end) < JOIN_GAP &&
    previous.highlight != null &&
    clip.highlight != null &&
    clip.highlight.word > previous.highlight.word
  );
}

/** The phrase on screen at `seconds`, or the one holding `clipId`. */
export function findPhrase(
  phrases: CaptionPhrase[],
  target: { at?: number; clipId?: string },
): CaptionPhrase {
  const found = phrases.find((phrase) =>
    target.clipId !== undefined
      ? phrase.clips.some((clip) => clip.id === target.clipId)
      : target.at! >= phrase.start && target.at! < phrase.end,
  );
  if (!found) {
    throw new Error(
      target.clipId !== undefined
        ? `No caption clip ${target.clipId} on that layer.`
        : `No caption on screen at ${target.at}s. list_captions shows their times.`,
    );
  }
  return found;
}
