/** Canvas of the video. Width and height are even (H.264 needs it). */
export interface VideoSetup {
  width: number;
  height: number;
  fps: number;
  background: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How a picture fills its box: crop to fill it, or fit inside it. */
export type Fit = 'cover' | 'contain';

interface ClipBase {
  id: string;
  /** Higher layers draw on top; audio from every layer is mixed. */
  layer: number;
  /** Seconds on the timeline where the clip begins. */
  start: number;
  /** Seconds to fade from/to transparent (and silent, for media). */
  fadeIn: number;
  fadeOut: number;
  /** 0..1 */
  opacity: number;
}

/** A video or audio file, trimmed to the [in, out] seconds of its source. */
export interface MediaClip extends ClipBase {
  kind: 'media';
  assetId: string;
  in: number;
  out: number;
  /** 1 = as recorded, 0 = muted. */
  volume: number;
  fit: Fit;
  /** Where it's shown; null = the whole frame. */
  box: Box | null;
}

/** A still image shown for `duration` seconds. */
export interface ImageClip extends ClipBase {
  kind: 'image';
  assetId: string;
  duration: number;
  fit: Fit;
  box: Box | null;
}

export interface TextStyle {
  font: string;
  size: number;
  weight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  /** Outline color around the letters; strokeWidth thick. */
  stroke: string | null;
  strokeWidth: number;
  /** Fills the box behind the text, e.g. a caption bar. */
  background: string | null;
  /** "shrink" lowers the size until the text fits the box. */
  fit: 'none' | 'shrink';
}

/** Text drawn inside `box` for `duration` seconds (titles, captions). */
export interface TextClip extends ClipBase {
  kind: 'text';
  text: string;
  duration: number;
  box: Box;
  style: TextStyle;
}

export type Clip = MediaClip | ImageClip | TextClip;
export type ClipKind = Clip['kind'];

/** What a project's commands replay to. */
export interface Timeline {
  setup: VideoSetup;
  clips: Clip[];
}
