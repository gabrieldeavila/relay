import type { VideoSetup } from './timeline-types.js';

/** Longest side of the editor's playback preview, in pixels. */
const PREVIEW_LONG_SIDE = 854;

export interface PreviewSize {
  width: number;
  height: number;
}

/** The video scaled down to fit the preview, keeping even sides for H.264. */
export function previewSize({ width, height }: VideoSetup): PreviewSize {
  const scale = Math.min(1, PREVIEW_LONG_SIDE / Math.max(width, height));
  return { width: even(width * scale), height: even(height * scale) };
}

const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);
