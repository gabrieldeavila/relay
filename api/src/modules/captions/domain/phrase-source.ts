import { clipEnd } from '../../videos/domain/clip-timing.js';
import type {
  MediaClip,
  Timeline,
} from '../../videos/domain/timeline-types.js';
import type { CaptionPhrase } from './caption-phrases.js';

/** Where a caption's words are said: which media and which source seconds. */
export interface PhraseSource {
  assetId: string;
  from: number;
  to: number;
}

/**
 * The audible media clip playing when the caption starts (the main track
 * first), with the caption's time moved into that file's seconds.
 */
export function phraseSource(
  timeline: Timeline,
  phrase: CaptionPhrase,
): PhraseSource | null {
  const clip = timeline.clips
    .filter((c): c is MediaClip => c.kind === 'media' && c.volume > 0)
    .filter((c) => c.start <= phrase.start && phrase.start < clipEnd(c))
    .sort((a, b) => a.layer - b.layer)[0];
  if (!clip) return null;
  const offset = clip.in - clip.start;
  return {
    assetId: clip.assetId,
    from: phrase.start + offset,
    to: Math.min(phrase.end, clipEnd(clip)) + offset,
  };
}
