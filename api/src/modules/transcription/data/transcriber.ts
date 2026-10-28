import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Asset } from '../../assets/domain/asset.js';
import { createSerialQueue } from '../../history/data/serial-queue.js';
import { parseWhisperJson } from '../domain/parse-whisper-json.js';
import type { Transcript } from '../domain/transcript.js';
import type { TranscriptionConfig } from '../domain/transcription-config.js';
import { extractAudio } from './extract-audio.js';
import { runWhisper } from './run-whisper.js';
import {
  readCachedTranscript,
  transcriptPath,
  writeCachedTranscript,
} from './transcript-cache.js';

export const TRANSCRIBER = Symbol('TRANSCRIBER');

/** Speech to timed words with local whisper.cpp; one file at a time. */
export class Transcriber {
  // whisper.cpp already uses every core; parallel runs only slow each other down.
  private readonly enqueue = createSerialQueue();

  constructor(private readonly config: TranscriptionConfig) {}

  async transcribe(asset: Asset, language?: string): Promise<Transcript> {
    if (!asset.hasAudio) {
      throw new Error(`${asset.name} has no audio to transcribe.`);
    }
    const lang = language?.trim().toLowerCase() || this.config.language;
    const cache = transcriptPath(asset.path, this.config.modelPath, lang);
    return (
      (await readCachedTranscript(cache)) ??
      this.enqueue(async () => {
        const done = await readCachedTranscript(cache);
        if (done) return done;
        const transcript = await this.run(asset.path, lang);
        await writeCachedTranscript(cache, transcript);
        return transcript;
      })
    );
  }

  private async run(mediaPath: string, language: string): Promise<Transcript> {
    const dir = await mkdtemp(join(tmpdir(), 'relay-whisper-'));
    try {
      const wav = join(dir, 'audio.wav');
      await extractAudio(mediaPath, wav);
      return parseWhisperJson(await runWhisper(this.config, wav, language));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
