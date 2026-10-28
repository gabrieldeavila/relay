import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type {
  MediaClip,
  Timeline,
} from '../../videos/domain/timeline-types.js';
import {
  layerField,
  videoIdField,
} from '../../videos/delivery/tools/video-fields.js';
import type { VideoServices } from '../../videos/delivery/video-services.js';
import type { Transcriber } from '../data/transcriber.js';
import { captionLook } from '../domain/caption-style.js';
import { planCaptions } from '../domain/plan-captions.js';
import type { Transcript } from '../domain/transcript.js';
import {
  captionHighlightField,
  captionPositionField,
  captionStyleField,
  languageField,
} from './transcription-fields.js';

const CAPTION_LAYER = 11;

const INPUT = {
  videoId: videoIdField,
  clipIds: z
    .array(z.string())
    .optional()
    .describe(
      'Video/audio clips whose speech to caption; default every audible clip on layer 0. Pass a voice-over clip here, never a music track.',
    ),
  language: languageField,
  style: captionStyleField,
  position: captionPositionField,
  maxWords: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(3)
    .describe('Words per caption; 1 = one word at a time'),
  font: z
    .string()
    .default('sans-serif')
    .describe(
      'CSS font family; load_font a Google Font first, e.g. "Montserrat"',
    ),
  size: z
    .number()
    .positive()
    .optional()
    .describe('Font size in pixels; default scales with the video'),
  color: z.string().optional().describe("Text color, overrides the style's"),
  highlight: captionHighlightField,
  highlightColor: z
    .string()
    .optional()
    .describe('CSS color of the highlighted word, or of its box'),
  layer: layerField.default(CAPTION_LAYER),
  replace: z
    .boolean()
    .default(true)
    .describe('Remove the text already on that layer first (earlier captions)'),
};

/** `auto_captions`: transcribes clips and adds their words as timed text clips. */
export function autoCaptionsTool(
  transcriber: Transcriber,
  s: VideoServices,
): McpTool {
  return {
    name: 'auto_captions',
    title: 'Auto captions',
    description: `Transcribes the speech in a video's clips (on this computer) and adds it as short timed captions, CapCut style: a few words at a time, in sync with the voice, with the word being said highlighted (one text clip per word; highlight="none" for one clip per caption). Captions are ordinary text clips on layer ${CAPTION_LAYER}, so update_clip can fix a word or restyle them, and the whole thing is one undo step. Trims are respected: only words inside each clip's in/out are shown. Check the result with preview_strip.`,
    input: INPUT,
    async run(input) {
      const { videoId, clipIds, language, maxWords, layer, replace, ...looks } =
        z.object(INPUT).parse(input);
      const before = (await s.projects.get(videoId)).timeline;
      const ids = clipIds ?? audibleMainClips(before);
      if (ids.length === 0) {
        throw new Error(
          'No audible video/audio clips on layer 0. Pass clipIds.',
        );
      }
      // Transcribe before taking the edit lock: it can take minutes.
      const transcripts = await transcribeClips(
        transcriber,
        s,
        before,
        ids,
        language,
      );
      let summary = '';
      await s.projects.edit(
        videoId,
        'auto_captions',
        (timeline) => {
          const look = captionLook(timeline.setup, looks);
          const plan = planCaptions(timeline, transcripts, {
            clipIds: ids,
            layer,
            maxWords,
            look,
            replace,
          });
          summary = describePlan(plan.added.length, plan.removed.length, layer);
          return [
            ...plan.removed.map((clipId) => ({
              type: 'delete_clip' as const,
              clipId,
            })),
            ...plan.added.map((clip) => ({ type: 'add_clip' as const, clip })),
          ];
        },
        async (timeline) => {
          const problems = await s.renderer.problems(timeline);
          if (problems.length > 0) throw new Error(problems.join('\n'));
        },
      );
      return { text: summary };
    },
  };
}

function audibleMainClips(timeline: Timeline): string[] {
  return timeline.clips
    .filter(
      (clip) => clip.kind === 'media' && clip.layer === 0 && clip.volume > 0,
    )
    .map((clip) => clip.id);
}

async function transcribeClips(
  transcriber: Transcriber,
  s: VideoServices,
  timeline: Timeline,
  clipIds: string[],
  language: string | undefined,
): Promise<Map<string, Transcript>> {
  const assetIds = new Set(
    timeline.clips
      .filter((clip): clip is MediaClip => clip.kind === 'media')
      .filter((clip) => clipIds.includes(clip.id))
      .map((clip) => clip.assetId),
  );
  const transcripts = new Map<string, Transcript>();
  for (const assetId of assetIds) {
    const asset = await s.assets.get(assetId);
    if (asset.hasAudio) {
      transcripts.set(assetId, await transcriber.transcribe(asset, language));
    }
  }
  return transcripts;
}

function describePlan(added: number, removed: number, layer: number) {
  if (added === 0) return 'No speech found in those clips; nothing was added.';
  const replaced =
    removed > 0 ? ` (replaced ${removed} earlier text clips)` : '';
  return `Added ${added} caption clips on layer ${layer}${replaced}. Check them with preview_strip; fix a word with update_clip.`;
}
