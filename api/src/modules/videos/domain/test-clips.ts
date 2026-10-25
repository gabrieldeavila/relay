import type { RenderInputs } from './render-inputs.js';
import type {
  ImageClip,
  MediaClip,
  TextClip,
  Timeline,
  VideoSetup,
} from './timeline-types.js';

/** Clips and inputs shared by the video domain specs. */
export const SETUP: VideoSetup = {
  width: 1080,
  height: 1920,
  fps: 30,
  background: '#000000',
};

export const media = (over: Partial<MediaClip> = {}): MediaClip => ({
  id: 'clip_1',
  kind: 'media',
  layer: 0,
  start: 0,
  assetId: 'video-a',
  in: 2,
  out: 7,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  fit: 'cover',
  box: null,
  ...over,
});

export const image = (over: Partial<ImageClip> = {}): ImageClip => ({
  id: 'clip_2',
  kind: 'image',
  layer: 1,
  start: 1,
  assetId: 'logo',
  duration: 3,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  fit: 'contain',
  box: { x: 40, y: 40, width: 200, height: 100 },
  ...over,
});

export const text = (over: Partial<TextClip> = {}): TextClip => ({
  id: 'clip_3',
  kind: 'text',
  layer: 2,
  start: 0,
  duration: 2,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  text: 'Hello',
  box: { x: 0, y: 1500, width: 1080, height: 200 },
  style: {
    font: 'sans-serif',
    size: 80,
    weight: 'bold',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.2,
    letterSpacing: 0,
    stroke: null,
    strokeWidth: 0,
    background: null,
    fit: 'shrink',
  },
  ...over,
});

export const timeline = (...clips: Timeline['clips']): Timeline => ({
  setup: SETUP,
  clips,
});

export const INPUTS: RenderInputs = {
  media: {
    'video-a': { path: '/a.mp4', hasVideo: true, hasAudio: true },
    song: { path: '/song.mp3', hasVideo: false, hasAudio: true },
    logo: { path: '/logo.png', hasVideo: true, hasAudio: false },
  },
  textImages: { clip_3: '/text-3.png' },
};
