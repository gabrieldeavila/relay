import { countWords } from '../../videos/domain/locate-word.js';
import type { TextClip } from '../../videos/domain/timeline-types.js';
import type { VideoCommand } from '../../videos/domain/video-command-types.js';
import type { CaptionPhrase } from './caption-phrases.js';
import { matchCaptionCase } from './caption-text.js';

interface Slot {
  start: number;
  end: number;
}

/**
 * Commands that make a caption say `text`. A highlighted caption keeps one
 * clip per word: existing words keep their timing, extra words share the last
 * word's time, and clips for removed words are deleted.
 */
export function rewritePhrase(
  phrase: CaptionPhrase,
  text: string,
  newClipId: () => string,
): VideoCommand[] {
  const fixed = matchCaptionCase(phrase.text, text.trim());
  if (!fixed) throw new Error('The caption text cannot be empty.');
  const highlighted = phrase.clips[0].highlight != null;
  if (!highlighted) {
    return phrase.clips.map((clip) => ({
      type: 'update_clip',
      clipId: clip.id,
      changes: { text: fixed },
    }));
  }
  const slots = wordSlots(phrase, countWords(fixed));
  return [
    ...slots.map((slot, word) =>
      word < phrase.clips.length
        ? updateWord(phrase.clips[word], fixed, slot, word)
        : addWord(phrase.clips.at(-1)!, newClipId(), fixed, slot, word),
    ),
    ...phrase.clips
      .slice(slots.length)
      .map((clip): VideoCommand => ({ type: 'delete_clip', clipId: clip.id })),
  ];
}

/** When each of `count` words is highlighted, filling the phrase's time. */
function wordSlots(phrase: CaptionPhrase, count: number): Slot[] {
  const starts = phrase.clips.slice(0, count).map((clip) => clip.start);
  const lastStart = starts.at(-1)!;
  const extra = count - starts.length;
  const piece = (phrase.end - lastStart) / (extra + 1);
  for (let k = 1; k <= extra; k++) starts.push(lastStart + piece * k);
  return starts.map((start, i) => ({
    start: round(start),
    end: round(starts[i + 1] ?? phrase.end),
  }));
}

function updateWord(
  clip: TextClip,
  text: string,
  slot: Slot,
  word: number,
): VideoCommand {
  return {
    type: 'update_clip',
    clipId: clip.id,
    changes: {
      text,
      start: slot.start,
      duration: round(slot.end - slot.start),
      highlight: { ...clip.highlight!, word },
    },
  };
}

function addWord(
  template: TextClip,
  id: string,
  text: string,
  slot: Slot,
  word: number,
): VideoCommand {
  return {
    type: 'add_clip',
    clip: {
      ...template,
      id,
      text,
      start: slot.start,
      duration: round(slot.end - slot.start),
      highlight: { ...template.highlight!, word },
    },
  };
}

const round = (seconds: number) => Math.round(seconds * 1000) / 1000;
