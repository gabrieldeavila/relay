import { readTranscriptionConfig } from './transcription-config.js';

describe('readTranscriptionConfig', () => {
  it('is off without a model', () => {
    expect(readTranscriptionConfig({})).toBeNull();
    expect(readTranscriptionConfig({ WHISPER_LANGUAGE: 'pt' })).toBeNull();
  });

  it('defaults to whisper-cli on PATH and auto language', () => {
    expect(
      readTranscriptionConfig({ WHISPER_MODEL_PATH: ' ~/m.bin ' }),
    ).toEqual({
      cliPath: 'whisper-cli',
      modelPath: '~/m.bin',
      language: 'auto',
    });
    expect(
      readTranscriptionConfig({
        WHISPER_MODEL_PATH: 'm.bin',
        WHISPER_CLI_PATH: '/opt/whisper-cli',
        WHISPER_LANGUAGE: 'PT',
      }),
    ).toMatchObject({ cliPath: '/opt/whisper-cli', language: 'pt' });
  });
});
