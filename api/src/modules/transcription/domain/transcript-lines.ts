import { groupCaptionChunks, SENTENCE_RULES } from './group-caption-chunks.js';
import type { Transcript } from './transcript.js';

/** The transcript as one sentence per line, with source times: "[1.2–4.8] text". */
export function transcriptLines(transcript: Transcript): string[] {
  return groupCaptionChunks(transcript.words, SENTENCE_RULES).map(
    (line) => `[${line.start.toFixed(1)}–${line.end.toFixed(1)}] ${line.text}`,
  );
}
