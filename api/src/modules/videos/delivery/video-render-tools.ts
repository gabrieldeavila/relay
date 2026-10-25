import { z } from 'zod';
import { publicUrl } from '../../../public-url.js';
import { describeAsset } from '../../assets/domain/describe-asset.js';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { shrinkPng } from '../data/shrink-png.js';
import { timelineDuration } from '../domain/clip-timing.js';
import { videoIdField } from './tools/video-fields.js';
import type { VideoServices } from './video-services.js';

/** Tools that show a video to the AI and render it to an mp4. */
export function videoRenderTools(s: VideoServices): McpTool[] {
  return [
    {
      name: 'preview_frame',
      title: 'Look at a frame',
      description:
        'Returns the frame at a given second as a PNG, so you can check framing, text and overlays. Fast at any point of the video.',
      input: {
        videoId: videoIdField,
        time: z.number().min(0).describe('Seconds on the timeline'),
        maxSize: z
          .number()
          .int()
          .min(64)
          .max(1920)
          .default(720)
          .describe('Longest side of the returned image'),
      },
      readOnly: true,
      async run({ videoId, time, maxSize }) {
        const project = await s.projects.get(videoId as string);
        const png = await s.renderer.frame(project.timeline, time as number);
        return {
          text: `Frame at ${time as number}s`,
          image: await shrinkPng(png, maxSize as number),
        };
      },
    },
    {
      name: 'preview_strip',
      title: 'Watch the video (contact sheet)',
      description:
        'Returns frames spread evenly over the whole video in one PNG, each labelled with its time: a quick way to "watch" the edit and check pacing.',
      input: {
        videoId: videoIdField,
        count: z.number().int().min(2).max(16).default(8),
        frameWidth: z.number().int().min(80).max(480).default(240),
      },
      readOnly: true,
      async run({ videoId, count, frameWidth }) {
        const project = await s.projects.get(videoId as string);
        const strip = await s.renderer.strip(
          project.timeline,
          count as number,
          frameWidth as number,
        );
        const total = timelineDuration(project.timeline);
        return {
          text: `${strip.times.length} frames over ${total}s at ${strip.times.join('s, ')}s`,
          image: strip.image,
        };
      },
    },
    {
      name: 'export_video',
      title: 'Export video',
      description:
        'Renders the video to an mp4 (H.264 + AAC) in the background and returns an exportId. Poll get_export until it is done; the result is a video asset with a file path and URL. Only export when the person asks or is happy with the previews.',
      input: {
        videoId: videoIdField,
        name: z.string().optional().describe('File name without extension'),
      },
      async run({ videoId, name }) {
        const project = await s.projects.get(videoId as string);
        const started = await s.exports.start(
          project.id,
          (name as string) ?? project.name,
          project.timeline,
        );
        const total = timelineDuration(project.timeline);
        return {
          text: `Exporting ${total}s of video. exportId: ${started.id}. Check it with get_export.`,
          data: { exportId: started.id },
        };
      },
    },
    {
      name: 'get_export',
      title: 'Export status',
      description:
        'Progress of an export; when done, the exported video asset (path and URL).',
      input: { exportId: z.string() },
      readOnly: true,
      async run({ exportId }) {
        const row = await s.exports.get(exportId as string);
        const asset = row.assetId
          ? describeAsset(await s.assets.get(row.assetId), publicUrl())
          : null;
        const data = {
          exportId: row.id,
          status: row.status,
          progress: Math.round(row.progress * 100) / 100,
          error: row.error,
          asset,
        };
        return { text: JSON.stringify(data, null, 2), data };
      },
    },
  ];
}
