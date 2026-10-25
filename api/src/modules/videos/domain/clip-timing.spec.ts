import type { Asset } from '../../assets/domain/asset.js';
import { clipAssetProblems } from './clip-asset-problems.js';
import { fadeAlpha, timelineDuration } from './clip-timing.js';
import { describeTimeline } from './describe-timeline.js';
import { frameTimeline, stripTimes } from './frame-timeline.js';
import { image, media, text, timeline } from './test-clips.js';

describe('timing', () => {
  it('measures the timeline and fades', () => {
    expect(timelineDuration(timeline(media({ start: 1 }), image()))).toBe(6);
    const clip = media({ fadeIn: 1, fadeOut: 2 });
    expect(fadeAlpha(clip, 0.5)).toBe(0.5);
    expect(fadeAlpha(clip, 2)).toBe(1);
    expect(fadeAlpha(clip, 4)).toBe(0.5);
  });

  it('builds a one-frame timeline for any moment, fades baked in', () => {
    const t = timeline(media({ fadeIn: 2 }), image());
    const frame = frameTimeline(t, 1);
    expect(frame.clips).toEqual([
      expect.objectContaining({
        id: 'clip_1',
        start: 0,
        in: 3,
        opacity: 0.5,
        volume: 0,
      }),
      expect.objectContaining({ id: 'clip_2', start: 0, duration: 1 / 30 }),
    ]);
    expect(frameTimeline(t, 4.5).clips.map((c) => c.id)).toEqual(['clip_1']);
    expect(() => frameTimeline(t, 5)).toThrow('outside the video');
    expect(stripTimes(t, 5)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5]);
  });
});

describe('clip assets', () => {
  const asset = (over: Partial<Asset>): Asset =>
    ({
      id: 'x',
      name: 'x.mp4',
      kind: 'video',
      durationMs: 5000,
      ...over,
    }) as Asset;

  it('checks the kind of file and the trim', () => {
    expect(clipAssetProblems(media({ out: 5 }), asset({}))).toEqual([]);
    expect(clipAssetProblems(media({ out: 6 }), asset({}))[0]).toContain(
      'past the end',
    );
    expect(
      clipAssetProblems(media(), asset({ kind: 'image', name: 'a.png' }))[0],
    ).toContain('is an image');
    expect(clipAssetProblems(image(), asset({}))[0]).toContain(
      'use it as a media clip',
    );
    expect(clipAssetProblems(image(), undefined)[0]).toContain(
      'does not exist',
    );
  });
});

describe('describeTimeline', () => {
  it('lists clips bottom layer first with their end', () => {
    const described = describeTimeline(timeline(text(), media()), {
      'video-a': 'beach.mp4',
    });
    expect(described.durationSeconds).toBe(5);
    expect(described.clipsByLayer.map((c) => [c.id, c.end])).toEqual([
      ['clip_1', 5],
      ['clip_3', 2],
    ]);
    expect(described.clipsByLayer[0]).toMatchObject({ assetName: 'beach.mp4' });
  });
});
