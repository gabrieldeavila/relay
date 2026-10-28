import { clipDuration } from './clip-timing.js';
import { countWords } from './locate-word.js';
import type { Clip, TextClip, VideoSetup } from './timeline-types.js';

/** Problems with a clip's own numbers, as messages an AI can act on. */
export function clipProblems(clip: Clip): string[] {
  const problems: string[] = [];
  if (clip.start < 0) problems.push('start must be 0 or more');
  if (!Number.isInteger(clip.layer) || clip.layer < 0) {
    problems.push('layer must be a whole number, 0 or more');
  }
  if (clip.kind === 'media') {
    if (clip.in < 0) problems.push('in must be 0 or more');
    if (clip.out <= clip.in) problems.push('out must be after in');
    if (clip.volume < 0 || clip.volume > 4)
      problems.push('volume must be 0..4');
  } else if (clip.duration <= 0) {
    problems.push('duration must be more than 0');
  }
  if (clip.opacity < 0 || clip.opacity > 1)
    problems.push('opacity must be 0..1');
  if (clip.fadeIn < 0 || clip.fadeOut < 0)
    problems.push('fades must be 0 or more');
  if (clip.fadeIn + clip.fadeOut > clipDuration(clip) + 1e-9) {
    problems.push('fadeIn + fadeOut must fit in the clip');
  }
  if (clip.kind === 'text') problems.push(...textProblems(clip));
  return problems;
}

function textProblems(clip: TextClip): string[] {
  if (!clip.text.trim()) return ['text is empty'];
  const word = clip.highlight?.word;
  if (word === undefined) return [];
  if (!Number.isInteger(word) || word < 0) {
    return ['highlight.word must be a whole number, 0 or more'];
  }
  const words = countWords(clip.text);
  return word >= words
    ? [`highlight.word ${word} is past the last word (the text has ${words})`]
    : [];
}

export function assertValidClip(clip: Clip): void {
  const problems = clipProblems(clip);
  if (problems.length > 0) {
    throw new Error(`Clip ${clip.id}: ${problems.join('; ')}`);
  }
}

export function assertValidSetup(setup: VideoSetup): void {
  const { width, height, fps } = setup;
  if (width % 2 !== 0 || height % 2 !== 0) {
    throw new Error('Video width and height must be even numbers');
  }
  if (width < 16 || height < 16 || width > 4096 || height > 4096) {
    throw new Error('Video size must be between 16 and 4096 pixels');
  }
  if (fps < 1 || fps > 120) throw new Error('fps must be 1..120');
}
