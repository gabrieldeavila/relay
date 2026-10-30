import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { videoIdField } from '../../videos/delivery/tools/video-fields.js';
import type { VideoServices } from '../../videos/delivery/video-services.js';
import { captionPhrases } from '../domain/caption-phrases.js';
import { captionLayerField } from './caption-fields.js';

const INPUT = {
  videoId: videoIdField,
  layer: captionLayerField,
  from: z
    .number()
    .min(0)
    .optional()
    .describe('Only captions after this second'),
  to: z.number().min(0).optional().describe('Only captions before this second'),
};

/** `list_captions`: the captions as text with their times, one line each. */
export function listCaptionsTool(s: VideoServices): McpTool {
  return {
    name: 'list_captions',
    title: 'List captions',
    description:
      'The captions on a layer as the viewer reads them, one line per caption with its start and end seconds. Much shorter than get_video; use it to proofread, then fix_caption or replace_in_captions.',
    input: INPUT,
    readOnly: true,
    async run(input) {
      const { videoId, layer, from, to } = z.object(INPUT).parse(input);
      const { timeline } = await s.projects.get(videoId);
      const phrases = captionPhrases(timeline, layer).filter(
        (p) => p.end > (from ?? 0) && p.start < (to ?? Infinity),
      );
      const lines = phrases.map(
        (p) => `${p.start.toFixed(2)}–${p.end.toFixed(2)}  ${p.text}`,
      );
      return {
        text: lines.length
          ? lines.join('\n')
          : `No captions on layer ${layer} there.`,
      };
    },
  };
}
