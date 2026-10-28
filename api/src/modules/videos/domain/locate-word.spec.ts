import { assertValidClip } from './check-clip.js';
import { countWords, locateWord } from './locate-word.js';
import type { TextClip } from './timeline-types.js';

describe('locateWord', () => {
  const lines = ['HOJE VAMOS', 'EDITAR  VÍDEOS.'];

  it('finds a word on its line with the text before it', () => {
    expect(locateWord(lines, 0)).toEqual({ line: 0, before: '', word: 'HOJE' });
    expect(locateWord(lines, 1)).toEqual({
      line: 0,
      before: 'HOJE ',
      word: 'VAMOS',
    });
    expect(locateWord(lines, 3)).toEqual({
      line: 1,
      before: 'EDITAR  ',
      word: 'VÍDEOS.',
    });
  });

  it('is null past the last word', () => {
    expect(locateWord(lines, 4)).toBeNull();
    expect(countWords(lines.join('\n'))).toBe(4);
  });
});

describe('text highlight checks', () => {
  const clip = (word: number): TextClip => ({
    id: 'clip_1',
    kind: 'text',
    layer: 10,
    start: 0,
    duration: 1,
    fadeIn: 0,
    fadeOut: 0,
    opacity: 1,
    text: 'one two',
    box: { x: 0, y: 0, width: 100, height: 50 },
    style: {
      font: 'sans-serif',
      size: 20,
      weight: 'bold',
      color: '#fff',
      align: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.1,
      letterSpacing: 0,
      stroke: null,
      strokeWidth: 0,
      background: null,
      fit: 'shrink',
    },
    highlight: { word, color: '#ff0', background: null },
  });

  it('accepts a word inside the text and rejects one past it', () => {
    expect(() => assertValidClip(clip(1))).not.toThrow();
    expect(() => assertValidClip(clip(2))).toThrow(
      'highlight.word 2 is past the last word (the text has 2)',
    );
  });
});
