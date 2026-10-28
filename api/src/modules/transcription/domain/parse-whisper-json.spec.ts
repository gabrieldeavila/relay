import { parseWhisperJson, type WhisperJson } from './parse-whisper-json.js';

const token = (text: string, from: number, to: number) => ({
  text,
  offsets: { from, to },
});

describe('parseWhisperJson', () => {
  it('joins word pieces and punctuation, and skips control tokens', () => {
    const json: WhisperJson = {
      result: { language: 'pt' },
      transcription: [
        {
          tokens: [
            token('[_BEG_]', 0, 0),
            token(' vamos', 1560, 2000),
            token(' ed', 2020, 2120),
            token('itar', 2220, 2560),
            token('.', 3300, 3320),
            token('[_TT_166]', 3320, 3320),
          ],
        },
        { tokens: [token(' A', 3320, 3400), token('tenção', 3400, 4040)] },
      ],
    };
    expect(parseWhisperJson(json)).toEqual({
      language: 'pt',
      words: [
        { text: 'vamos', start: 1.56, end: 2 },
        { text: 'editar.', start: 2.02, end: 3.32 },
        { text: 'Atenção', start: 3.32, end: 4.04 },
      ],
    });
  });

  it('drops non-speech markers', () => {
    const json: WhisperJson = {
      transcription: [
        {
          tokens: [
            token(' [', 0, 10),
            token('BLANK_AUDIO', 10, 20),
            token(']', 20, 30),
            token(' (music)', 30, 900),
            token(' hi', 1000, 1200),
          ],
        },
      ],
    };
    expect(parseWhisperJson(json)).toEqual({
      language: 'unknown',
      words: [{ text: 'hi', start: 1, end: 1.2 }],
    });
  });
});
