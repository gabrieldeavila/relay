import { rewriteTranscriptWords } from './rewrite-transcript-words.js';
import type { TimedWord } from './transcript.js';

const w = (text: string, start: number, end: number): TimedWord => ({
  text,
  start,
  end,
});

const words = [
  w('um', 0, 0.3),
  w('gaúcho', 0.3, 0.7),
  w('farro', 0.7, 1),
  w('pilha', 1, 1.4),
  w('firme,', 1.4, 2),
];

describe('rewriteTranscriptWords', () => {
  it('swaps text and keeps times when the count stays', () => {
    const out = rewriteTranscriptWords(words, 0, 1, () => 'Um gaúcho farrapo');
    expect(out.slice(0, 3)).toEqual([
      w('Um', 0, 0.3),
      w('gaúcho', 0.3, 0.7),
      w('farrapo', 0.7, 1),
    ]);
    expect(out.slice(3)).toEqual(words.slice(3));
  });

  it('stretches the last word over removed ones', () => {
    const out = rewriteTranscriptWords(words, 0.7, 1.4, () => 'farroupilha,');
    expect(out.map((x) => x.text)).toEqual([
      'um',
      'gaúcho',
      'farroupilha,',
      'firme,',
    ]);
    expect(out[2]).toEqual(w('farroupilha,', 0.7, 1.4));
  });

  it('shares the last word time with extra words', () => {
    const out = rewriteTranscriptWords(words, 1.4, 2, () => 'firme e forte');
    expect(out.slice(4)).toEqual([
      w('firme', 1.4, 1.6),
      w('e', 1.6, 1.8),
      w('forte', 1.8, 2),
    ]);
  });

  it('hands the old text to the rewrite and ignores rounding', () => {
    const out = rewriteTranscriptWords(words, 0.301, 0.6999, (old) =>
      old.replace('gaúcho', 'GAÚCHO'),
    );
    expect(out[1].text).toBe('GAÚCHO');
    expect(out).toHaveLength(5);
  });

  it('leaves the words alone when none is in the range', () => {
    expect(rewriteTranscriptWords(words, 5, 6, () => 'x')).toBe(words);
  });
});
