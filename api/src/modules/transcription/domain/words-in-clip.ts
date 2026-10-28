import type { MediaClip } from '../../videos/domain/timeline-types.js';
import type { TimedWord } from './transcript.js';

/** The words said inside a clip's trim, moved to timeline seconds. */
export function wordsInClip(words: TimedWord[], clip: MediaClip): TimedWord[] {
  const offset = clip.start - clip.in;
  return words
    .filter((word) => word.start >= clip.in && word.start < clip.out)
    .map((word) => ({
      text: word.text,
      start: word.start + offset,
      end: Math.min(word.end, clip.out) + offset,
    }));
}
