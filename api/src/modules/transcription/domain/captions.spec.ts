import type {
  MediaClip,
  Timeline,
} from '../../videos/domain/timeline-types.js';
import { captionHighlight } from './caption-highlight.js';
import { captionLook } from './caption-style.js';
import { CAPTION_RULES, groupCaptionChunks } from './group-caption-chunks.js';
import { holdCaptions } from './hold-captions.js';
import { planCaptions } from './plan-captions.js';
import { splitByWord } from './split-by-word.js';
import type { TimedWord } from './transcript.js';
import { wordsInClip } from './words-in-clip.js';

const w = (text: string, start: number, end: number): TimedWord => ({
  text,
  start,
  end,
});

const media = (changes: Partial<MediaClip> = {}): MediaClip => ({
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

const setup = { width: 1080, height: 1920, fps: 30, background: '#000' };

describe('groupCaptionChunks', () => {
  it('makes chunks of up to maxWords', () => {
    const words = ['one', 'two', 'three', 'four'].map((t, i) =>
      w(t, i * 0.3, i * 0.3 + 0.25),
    );
    expect(groupCaptionChunks(words, CAPTION_RULES).map((c) => c.text)).toEqual(
      ['one two three', 'four'],
    );
  });

  it('breaks after punctuation, at pauses and when too long', () => {
    const words = [
      w('Hello,', 0, 0.4),
      w('so', 0.5, 0.6),
      w('then', 2, 2.2),
      w('extraordinarily', 2.3, 3),
      w('long', 3.1, 3.3),
    ];
    expect(groupCaptionChunks(words, CAPTION_RULES).map((c) => c.text)).toEqual(
      ['Hello,', 'so', 'then', 'extraordinarily', 'long'],
    );
  });
});

describe('holdCaptions', () => {
  it('bridges short gaps, keeps long ones, and never overlaps', () => {
    const held = holdCaptions([
      { text: 'a', start: 0, end: 0.5, words: [] },
      { text: 'b', start: 0.8, end: 0.85, words: [] },
      { text: 'c', start: 3, end: 3.5, words: [] },
    ]);
    expect(held.map((c) => [c.start, c.end])).toEqual([
      [0, 0.8],
      [0.8, 1.1],
      [3, 3.5],
    ]);
  });
});

describe('wordsInClip', () => {
  it('keeps words inside the trim and moves them to timeline time', () => {
    const words = [w('cut', 1, 1.5), w('kept', 2.5, 3), w('late', 6, 6.5)];
    const clip = media({ start: 10, in: 2, out: 5 });
    expect(wordsInClip(words, clip)).toEqual([
      { text: 'kept', start: 10.5, end: 11 },
    ]);
  });
});

describe('planCaptions', () => {
  const timeline: Timeline = {
    setup,
    clips: [
      media(),
      {
        id: 'clip_7',
        kind: 'text',
        layer: 11,
        start: 0,
        duration: 1,
        text: 'old',
        box: { x: 0, y: 0, width: 10, height: 10 },
        style: captionLook(setup, {
          style: 'bold',
          position: 'lower',
          font: 'x',
        }).style,
        fadeIn: 0,
        fadeOut: 0,
        opacity: 1,
      },
    ],
  };
  const transcripts = new Map([
    [
      'a1',
      { language: 'en', words: [w('hi', 0, 0.3), w('there.', 0.35, 0.8)] },
    ],
  ]);

  it('adds uppercase text clips with new ids and replaces old captions', () => {
    const plan = planCaptions(timeline, transcripts, {
      clipIds: ['clip_1'],
      layer: 11,
      maxWords: 3,
      replace: true,
      look: captionLook(setup, { style: 'bold', position: 'lower', font: 'x' }),
    });
    expect(plan.removed).toEqual(['clip_7']);
    expect(plan.added).toHaveLength(1);
    expect(plan.added[0]).toMatchObject({
      id: 'clip_8',
      layer: 11,
      start: 0,
      duration: 0.8,
      text: 'HI THERE.',
      highlight: null,
    });
  });

  it('makes one clip per word when highlighting the spoken word', () => {
    const plan = planCaptions(timeline, transcripts, {
      clipIds: ['clip_1'],
      layer: 11,
      maxWords: 3,
      replace: false,
      look: captionLook(setup, {
        style: 'bold',
        position: 'lower',
        font: 'x',
        highlight: 'color',
      }),
    });
    expect(
      plan.added.map((c) => [c.id, c.start, c.duration, c.highlight?.word]),
    ).toEqual([
      ['clip_8', 0, 0.35, 0],
      ['clip_9', 0.35, 0.45, 1],
    ]);
    expect(plan.added[1].highlight).toEqual({
      word: 1,
      color: '#ffe600',
      background: null,
    });
  });

  it('rejects clips that are not media', () => {
    expect(() =>
      planCaptions(timeline, transcripts, {
        clipIds: ['clip_7'],
        layer: 11,
        maxWords: 3,
        replace: false,
        look: captionLook(setup, {
          style: 'clean',
          position: 'top',
          font: 'x',
        }),
      }),
    ).toThrow('clip_7 is not a video or audio clip');
  });
});

describe('captionLook', () => {
  it('sizes text and box to the video and keeps the box inside it', () => {
    const look = captionLook(setup, {
      style: 'boxed',
      position: 'lower',
      font: 'x',
    });
    expect(look.style.size).toBe(81);
    expect(look.uppercase).toBe(false);
    expect(look.box.x + look.box.width).toBeLessThanOrEqual(1080);
    expect(look.box.y + look.box.height).toBeLessThanOrEqual(1920);
  });
});

describe('splitByWord', () => {
  it('moves along the words and holds the last until the chunk ends', () => {
    const steps = splitByWord({
      text: 'a b c',
      start: 0,
      end: 2,
      words: [w('a', 0.1, 0.4), w('b', 0.5, 0.6), w('c', 0.5, 0.9)],
    });
    expect(steps).toEqual([
      { text: 'a b c', word: 0, start: 0, end: 0.5 },
      { text: 'a b c', word: 2, start: 0.5, end: 2 },
    ]);
  });
});

describe('captionHighlight', () => {
  it('picks a color that stands out from the text', () => {
    expect(captionHighlight('color', '#ffffff')).toEqual({
      color: '#ffe600',
      background: null,
    });
    expect(captionHighlight('color', '#FFE600')?.color).toBe('#22c55e');
    expect(captionHighlight('box', '#ffffff', '#ff0080')).toEqual({
      color: '#ffffff',
      background: '#ff0080',
    });
    expect(captionHighlight('none', '#ffffff')).toBeNull();
  });
});
