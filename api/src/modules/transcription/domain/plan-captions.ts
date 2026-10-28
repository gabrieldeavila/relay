import { nextClipId } from '../../videos/domain/next-clip-id.js';
import type {
  MediaClip,
  TextClip,
  Timeline,
} from '../../videos/domain/timeline-types.js';
import type { CaptionLook } from './caption-style.js';
import {
  CAPTION_RULES,
  groupCaptionChunks,
  type CaptionChunk,
} from './group-caption-chunks.js';
import { holdCaptions } from './hold-captions.js';
import { splitByWord } from './split-by-word.js';
import type { Transcript } from './transcript.js';
import { wordsInClip } from './words-in-clip.js';

export interface CaptionPlanOptions {
  clipIds: string[];
  layer: number;
  maxWords: number;
  look: CaptionLook;
  /** Remove the text clips already on `layer` first (earlier captions). */
  replace: boolean;
}

/** What one text clip shows: a caption, with the spoken word when highlighting. */
interface CaptionStep {
  text: string;
  start: number;
  end: number;
  word: number | null;
}

export interface CaptionPlan {
  removed: string[];
  added: TextClip[];
}

/**
 * Caption clips for what is said in the given media clips. With a highlight,
 * each caption becomes one clip per word so the highlight follows the voice.
 */
export function planCaptions(
  timeline: Timeline,
  transcripts: Map<string, Transcript>,
  options: CaptionPlanOptions,
): CaptionPlan {
  const removed = options.replace ? textClipIdsOn(timeline, options.layer) : [];
  const chunks = holdCaptions(
    sources(timeline, options.clipIds)
      .flatMap((clip) => chunksOf(clip, transcripts, options.maxWords))
      .sort((a, b) => a.start - b.start),
  );
  const steps = chunks.flatMap((chunk): CaptionStep[] =>
    options.look.highlight ? splitByWord(chunk) : [{ ...chunk, word: null }],
  );
  const taken: string[] = [];
  const added = steps.map((step) => {
    const clip = toTextClip(step, nextClipId(timeline, taken), options);
    taken.push(clip.id);
    return clip;
  });
  return { removed, added };
}

function sources(timeline: Timeline, clipIds: string[]): MediaClip[] {
  return clipIds.map((id) => {
    const clip = timeline.clips.find((c) => c.id === id);
    if (!clip || clip.kind !== 'media') {
      throw new Error(`${id} is not a video or audio clip. Use get_video.`);
    }
    return clip;
  });
}

function chunksOf(
  clip: MediaClip,
  transcripts: Map<string, Transcript>,
  maxWords: number,
): CaptionChunk[] {
  const words = transcripts.get(clip.assetId)?.words ?? [];
  return groupCaptionChunks(wordsInClip(words, clip), {
    ...CAPTION_RULES,
    maxWords,
    maxChars: maxWords === 1 ? Infinity : CAPTION_RULES.maxChars,
  });
}

function toTextClip(
  step: CaptionStep,
  id: string,
  { layer, look }: CaptionPlanOptions,
): TextClip {
  const highlight =
    look.highlight && step.word !== null
      ? { word: step.word, ...look.highlight }
      : null;
  return {
    id,
    kind: 'text',
    layer,
    start: round(step.start),
    duration: round(step.end - step.start),
    fadeIn: 0,
    fadeOut: 0,
    opacity: 1,
    text: look.uppercase ? step.text.toLocaleUpperCase() : step.text,
    box: look.box,
    style: look.style,
    highlight,
  };
}

const textClipIdsOn = (timeline: Timeline, layer: number) =>
  timeline.clips
    .filter((clip) => clip.kind === 'text' && clip.layer === layer)
    .map((clip) => clip.id);

const round = (seconds: number) => Math.round(seconds * 1000) / 1000;
