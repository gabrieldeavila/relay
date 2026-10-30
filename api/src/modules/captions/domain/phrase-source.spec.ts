import type {
  MediaClip,
  Timeline,
} from '../../videos/domain/timeline-types.js';
import type { CaptionPhrase } from './caption-phrases.js';
import { phraseSource } from './phrase-source.js';

const media = (changes: Partial<MediaClip>): MediaClip => ({
  id: 'clip_1',
  kind: 'media',
  assetId: 'a1',
  layer: 0,
  start: 0,
  in: 0,
  out: 10,
  volume: 1,
  fit: 'cover',
  box: null,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  ...changes,
});

const phrase = (start: number, end: number): CaptionPhrase => ({
  text: 'X',
  start,
  end,
  clips: [],
});

const timeline = (clips: MediaClip[]): Timeline => ({
  setup: { width: 1080, height: 1920, fps: 30, background: '#000' },
  clips,
});

describe('phraseSource', () => {
  it('moves the caption time into the trimmed source', () => {
    const t = timeline([media({ start: 2, in: 5, out: 15 })]);
    expect(phraseSource(t, phrase(3, 4))).toEqual({
      assetId: 'a1',
      from: 6,
      to: 7,
    });
  });

  it('prefers the main track and skips muted clips', () => {
    const t = timeline([
      media({ id: 'm', assetId: 'music', layer: 1 }),
      media({ id: 'mute', assetId: 'muted', volume: 0 }),
      media({ id: 'v', assetId: 'voice', layer: 0 }),
    ]);
    expect(phraseSource(t, phrase(1, 2))?.assetId).toBe('voice');
  });

  it('is null without audible media under the caption', () => {
    expect(phraseSource(timeline([]), phrase(1, 2))).toBeNull();
  });
});
