import { applyVideoCommand } from '../../videos/domain/apply-video-command.js';
import { clipIdSequence } from '../../videos/domain/next-clip-id.js';
import { DEFAULT_TEXT_STYLE } from '../../videos/domain/default-text-style.js';
import type { TextClip, Timeline } from '../../videos/domain/timeline-types.js';
import { captionPhrases, findPhrase } from './caption-phrases.js';
import { matchCaptionCase, replaceInCaption } from './caption-text.js';
import { rewritePhrase } from './rewrite-phrase.js';

const setup = { width: 1080, height: 1920, fps: 30, background: '#000' };

let n = 0;
const caption = (
  text: string,
  start: number,
  duration: number,
  word: number | null,
): TextClip => ({
  id: `clip_${++n}`,
  kind: 'text',
  layer: 11,
  start,
  duration,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  text,
  box: { x: 0, y: 0, width: 100, height: 50 },
  style: DEFAULT_TEXT_STYLE,
  highlight:
    word === null ? null : { word, color: '#ffe600', background: null },
});

/** "TU JÁ REPAROU" (3 word clips), then "SIM" twice in a row. */
function timeline(): Timeline {
  n = 0;
  return {
    setup,
    clips: [
      caption('TU JÁ REPAROU', 0, 0.2, 0),
      caption('TU JÁ REPAROU', 0.2, 0.3, 1),
      caption('TU JÁ REPAROU', 0.5, 0.5, 2),
      caption('SIM', 1, 0.5, 0),
      caption('SIM', 1.5, 0.5, 0),
    ],
  };
}

const apply = (t: Timeline, commands: ReturnType<typeof rewritePhrase>) =>
  commands.reduce(applyVideoCommand, t);

const texts = (t: Timeline) =>
  t.clips
    .map((c) => c as TextClip)
    .sort((a, b) => a.start - b.start)
    .map((c) => [c.text, c.start, c.duration, c.highlight?.word]);

describe('captionPhrases', () => {
  it('joins word clips of one caption and splits repeats', () => {
    const phrases = captionPhrases(timeline(), 11);
    expect(
      phrases.map((p) => [p.text, p.start, p.end, p.clips.length]),
    ).toEqual([
      ['TU JÁ REPAROU', 0, 1, 3],
      ['SIM', 1, 1.5, 1],
      ['SIM', 1.5, 2, 1],
    ]);
  });

  it('finds the caption on screen at a second or by clip', () => {
    const phrases = captionPhrases(timeline(), 11);
    expect(findPhrase(phrases, { at: 0.7 }).text).toBe('TU JÁ REPAROU');
    expect(findPhrase(phrases, { clipId: 'clip_5' }).start).toBe(1.5);
    expect(() => findPhrase(phrases, { at: 9 })).toThrow('list_captions');
  });
});

describe('rewritePhrase', () => {
  const first = (t: Timeline) => captionPhrases(t, 11)[0];

  it('keeps timings when the word count stays', () => {
    const t = timeline();
    const after = apply(
      t,
      rewritePhrase(first(t), 'tu já notou', clipIdSequence(t)),
    );
    expect(texts(after).slice(0, 3)).toEqual([
      ['TU JÁ NOTOU', 0, 0.2, 0],
      ['TU JÁ NOTOU', 0.2, 0.3, 1],
      ['TU JÁ NOTOU', 0.5, 0.5, 2],
    ]);
  });

  it('deletes clips for removed words and stretches the last one', () => {
    const t = timeline();
    const after = apply(
      t,
      rewritePhrase(first(t), 'reparou', clipIdSequence(t)),
    );
    expect(texts(after).slice(0, 2)).toEqual([
      ['REPAROU', 0, 1, 0],
      ['SIM', 1, 0.5, 0],
    ]);
  });

  it('adds clips for extra words in the last word time', () => {
    const t = timeline();
    const after = apply(
      t,
      rewritePhrase(first(t), 'tu já reparou isso', clipIdSequence(t)),
    );
    expect(texts(after).slice(0, 4)).toEqual([
      ['TU JÁ REPAROU ISSO', 0, 0.2, 0],
      ['TU JÁ REPAROU ISSO', 0.2, 0.3, 1],
      ['TU JÁ REPAROU ISSO', 0.5, 0.25, 2],
      ['TU JÁ REPAROU ISSO', 0.75, 0.25, 3],
    ]);
    expect(after.clips.at(-1)!.id).toBe('clip_6');
  });

  it('only changes the text of captions without a highlight', () => {
    n = 0;
    const plain = caption('hello world', 0, 1, null);
    const t: Timeline = { setup, clips: [plain] };
    const after = apply(
      t,
      rewritePhrase(first(t), 'hi there you', clipIdSequence(t)),
    );
    expect(texts(after)).toEqual([['hi there you', 0, 1, undefined]]);
  });
});

describe('caption text', () => {
  it('keeps all-caps captions in caps', () => {
    expect(matchCaptionCase('OLÁ', 'mouriscos')).toBe('MOURISCOS');
    expect(matchCaptionCase('Olá', 'mouriscos')).toBe('mouriscos');
  });

  it('replaces whole words ignoring case and accents stay intact', () => {
    expect(
      replaceInCaption('GATOS MORISCOS', 'moriscos', 'Mouriscos', true),
    ).toBe('GATOS Mouriscos');
    expect(replaceInCaption('banana ana', 'ana', 'X', true)).toBe('banana X');
    expect(replaceInCaption('banana', 'ana', 'X', false)).toBe('bXna');
    expect(replaceInCaption('é isso', 'é', 'e', true)).toBe('e isso');
  });
});
