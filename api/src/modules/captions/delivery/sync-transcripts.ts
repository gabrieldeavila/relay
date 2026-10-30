import type { Timeline } from '../../videos/domain/timeline-types.js';
import type { VideoEditDeps } from '../../videos/delivery/tools/video-edit-tool.js';
import type { CaptionPhrase } from '../domain/caption-phrases.js';
import { phraseSource } from '../domain/phrase-source.js';

export interface PhraseRewrite {
  phrase: CaptionPhrase;
  /** The transcript's words for the caption, in their own case, rewritten. */
  rewrite: (oldText: string) => string;
}

/**
 * After captions are fixed, makes the same fix in the cached transcripts of
 * the media they were made from, so transcribe_video and new auto_captions
 * keep it. Returns a note for the AI, or null when there was no transcript.
 */
export function syncTranscripts(
  timeline: Timeline,
  rewrites: PhraseRewrite[],
  deps: VideoEditDeps,
): () => Promise<string | null> {
  const jobs = rewrites.flatMap(({ phrase, rewrite }) => {
    const source = phraseSource(timeline, phrase);
    return source ? [{ ...source, rewrite }] : [];
  });
  return async () => {
    let fixed = 0;
    for (const job of jobs) {
      const asset = await deps.assets.get(job.assetId);
      const files = await deps.transcripts.rewrite(
        asset.path,
        job.from,
        job.to,
        job.rewrite,
      );
      if (files > 0) fixed++;
    }
    return fixed > 0
      ? `Fixed the transcript too (${fixed} place(s)), so transcribe_video and auto_captions keep it.`
      : null;
  };
}
