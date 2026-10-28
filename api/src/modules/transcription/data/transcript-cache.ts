import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { Transcript } from '../domain/transcript.js';

/**
 * Transcripts are kept next to the asset's file, one per model and language,
 * so a video is only transcribed once.
 */
export function transcriptPath(
  assetPath: string,
  modelPath: string,
  language: string,
): string {
  const model = basename(modelPath, extname(modelPath));
  return `${assetPath}.${model}.${language}.words.json`;
}

export async function readCachedTranscript(
  path: string,
): Promise<Transcript | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Transcript;
  } catch {
    return null;
  }
}

export function writeCachedTranscript(path: string, transcript: Transcript) {
  return writeFile(path, JSON.stringify(transcript));
}
