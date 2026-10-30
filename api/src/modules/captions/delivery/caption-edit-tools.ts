import { z } from 'zod';
import { clipIdSequence } from '../../videos/domain/next-clip-id.js';
import type { VideoCommand } from '../../videos/domain/video-command-types.js';
import { defineVideoEdit } from '../../videos/delivery/tools/video-edit-tool.js';
import { captionPhrases, findPhrase } from '../domain/caption-phrases.js';
import { replaceInCaption } from '../domain/caption-text.js';
import { rewritePhrase } from '../domain/rewrite-phrase.js';
import { captionLayerField } from './caption-fields.js';
import { syncTranscripts, type PhraseRewrite } from './sync-transcripts.js';

export const captionEditTools = [
  defineVideoEdit({
    name: 'fix_caption',
    title: 'Fix caption',
    description:
      'Rewrites one caption (e.g. a word the transcription got wrong): the caption on screen at `at` seconds, or the one holding clipId. Handles the one-clip-per-word highlight clips together and fixes the same words in the cached transcript. Find captions with list_captions.',
    input: {
      text: z
        .string()
        .min(1)
        .describe(
          'What the caption should say, in normal sentence case (it also fixes the transcript; all-caps captions are uppercased)',
        ),
      at: z.number().min(0).optional().describe('A second while it shows'),
      clipId: z.string().optional(),
      layer: captionLayerField,
    },
    plan({ text, at, clipId, layer }, timeline, deps) {
      if (at === undefined && clipId === undefined) {
        throw new Error('Pass at (seconds) or clipId.');
      }
      const phrase = findPhrase(captionPhrases(timeline, layer), {
        at,
        clipId,
      });
      const commands = rewritePhrase(phrase, text, clipIdSequence(timeline));
      return {
        commands,
        text: `Caption at ${phrase.start}s: "${phrase.text}" → "${text}".`,
        after: syncTranscripts(
          timeline,
          [{ phrase, rewrite: () => text }],
          deps,
        ),
      };
    },
  }),

  defineVideoEdit({
    name: 'replace_in_captions',
    title: 'Replace in captions',
    description:
      'Fixes a word or name the transcription got wrong everywhere in the captions, and in the transcript (ignores case; all-caps captions stay all caps). One undo step for the captions.',
    input: {
      find: z.string().min(1),
      replace: z.string().min(1),
      wholeWord: z
        .boolean()
        .default(true)
        .describe('Only whole words: "ana" leaves "banana" alone'),
      layer: captionLayerField,
    },
    plan({ find, replace, wholeWord, layer }, timeline, deps) {
      const nextId = clipIdSequence(timeline);
      const commands: VideoCommand[] = [];
      const changed: string[] = [];
      const rewrites: PhraseRewrite[] = [];
      const rewrite = (old: string) =>
        replaceInCaption(old, find, replace, wholeWord);
      for (const phrase of captionPhrases(timeline, layer)) {
        const text = rewrite(phrase.text);
        if (text === phrase.text) continue;
        commands.push(...rewritePhrase(phrase, text, nextId));
        rewrites.push({ phrase, rewrite });
        changed.push(`${phrase.start}s`);
      }
      if (changed.length === 0) {
        throw new Error(`"${find}" is not in the captions on layer ${layer}.`);
      }
      return {
        commands,
        text: `Replaced "${find}" with "${replace}" in ${changed.length} caption(s), at ${changed.join(', ')}.`,
        after: syncTranscripts(timeline, rewrites, deps),
      };
    },
  }),
];
