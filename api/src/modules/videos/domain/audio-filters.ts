import { clipDuration } from './clip-timing.js';
import { seconds } from './render-inputs.js';
import type { MediaClip } from './timeline-types.js';

/** Filters that turn a media clip's audio into a stream placed at its start. */
export function audioChain(clip: MediaClip): string[] {
  const length = clipDuration(clip);
  const filters = [
    'asetpts=PTS-STARTPTS',
    'aresample=48000',
    'aformat=channel_layouts=stereo',
  ];
  if (clip.volume !== 1) filters.push(`volume=${seconds(clip.volume)}`);
  if (clip.fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${seconds(clip.fadeIn)}`);
  }
  if (clip.fadeOut > 0) {
    const start = seconds(length - clip.fadeOut);
    filters.push(`afade=t=out:st=${start}:d=${seconds(clip.fadeOut)}`);
  }
  const delayMs = Math.round(clip.start * 1000);
  if (delayMs > 0) filters.push(`adelay=delays=${delayMs}:all=1`);
  return filters;
}

/** Mixes labelled audio streams into `[aout]` without lowering their volume. */
export function mixAudio(labels: string[]): string {
  if (labels.length === 1) return `${labels[0]}anull[aout]`;
  return `${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0[aout]`;
}
