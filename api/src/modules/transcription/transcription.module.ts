import { Module } from '@nestjs/common';
import { Transcriber, TRANSCRIBER } from './data/transcriber.js';
import { readTranscriptionConfig } from './domain/transcription-config.js';

/** Local speech-to-text, when set up in the environment; otherwise null and Relay works without it. */
@Module({
  providers: [
    {
      provide: TRANSCRIBER,
      useFactory: () => {
        const config = readTranscriptionConfig(process.env);
        return config ? new Transcriber(config) : null;
      },
    },
  ],
  exports: [TRANSCRIBER],
})
export class TranscriptionModule {}
