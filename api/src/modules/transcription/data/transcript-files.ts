import { readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { createSerialQueue } from '../../history/data/serial-queue.js';
import { rewriteTranscriptWords } from '../domain/rewrite-transcript-words.js';
import {
  readCachedTranscript,
  writeCachedTranscript,
} from './transcript-cache.js';

/** Edits the cached transcripts of a media file (one per model and language). */
export function createTranscriptFiles() {
  const enqueue = createSerialQueue();

  async function cachedFor(assetPath: string): Promise<string[]> {
    const prefix = `${basename(assetPath)}.`;
    const names = await readdir(dirname(assetPath)).catch(() => []);
    return names
      .filter((name) => name.startsWith(prefix) && name.endsWith('.words.json'))
      .map((name) => join(dirname(assetPath), name));
  }

  return {
    /**
     * Rewrites the words said between `from` and `to` (source seconds) in
     * every cached transcript of the file. Returns how many files changed.
     */
    rewrite(
      assetPath: string,
      from: number,
      to: number,
      rewrite: (oldText: string) => string,
    ): Promise<number> {
      return enqueue(async () => {
        let changed = 0;
        for (const path of await cachedFor(assetPath)) {
          const transcript = await readCachedTranscript(path);
          if (!transcript) continue;
          const words = rewriteTranscriptWords(
            transcript.words,
            from,
            to,
            rewrite,
          );
          if (words === transcript.words) continue;
          await writeCachedTranscript(path, { ...transcript, words });
          changed++;
        }
        return changed;
      });
    },
  };
}

export type TranscriptFiles = ReturnType<typeof createTranscriptFiles>;
