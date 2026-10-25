import type { Clip, Timeline } from './timeline-types.js';

/** Seconds the clip lasts on the timeline. */
export const clipDuration = (clip: Clip) =>
  clip.kind === 'media' ? clip.out - clip.in : clip.duration;

export const clipEnd = (clip: Clip) => clip.start + clipDuration(clip);

/** Where the last clip ends. */
export const timelineDuration = (timeline: Timeline) =>
  Math.max(0, ...timeline.clips.map(clipEnd));

export const isActiveAt = (clip: Clip, t: number) =>
  t >= clip.start && t < clipEnd(clip);

/** 0..1 visibility of a clip at time t from its fades (1 outside them). */
export function fadeAlpha(clip: Clip, t: number): number {
  const fromStart = t - clip.start;
  const toEnd = clipEnd(clip) - t;
  const fadingIn = clip.fadeIn > 0 ? fromStart / clip.fadeIn : 1;
  const fadingOut = clip.fadeOut > 0 ? toEnd / clip.fadeOut : 1;
  return Math.max(0, Math.min(1, fadingIn, fadingOut));
}
