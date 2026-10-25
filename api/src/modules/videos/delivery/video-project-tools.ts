import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { assetNamesOf } from '../data/asset-names.js';
import { describeTimeline } from '../domain/describe-timeline.js';
import { videoIdField } from './tools/video-fields.js';
import type { VideoServices } from './video-services.js';

/** Tools that start, list, read and undo video projects. */
export function videoProjectTools(s: VideoServices): McpTool[] {
  return [
    {
      name: 'create_video',
      title: 'New video',
      description:
        'Starts a new video project with an empty timeline. Defaults to vertical 1080x1920 at 30 fps (use 1920x1080 for landscape, 1080x1080 for square). Returns its videoId.',
      input: {
        name: z.string().default('Untitled video'),
        width: z.number().int().default(1080),
        height: z.number().int().default(1920),
        fps: z.number().int().default(30),
        background: z.string().default('#000000'),
      },
      async run({ name, ...setup }) {
        const id = await s.projects.create(name as string, setup as never);
        return {
          text: `New video. videoId: ${id}. Add footage with add_clip.`,
          data: { videoId: id },
        };
      },
    },
    {
      name: 'list_videos',
      title: 'List videos',
      description: 'Video projects, most recently edited first.',
      input: {},
      readOnly: true,
      async run() {
        const videos = (await s.projects.list()).map((row) => ({
          videoId: row.id,
          name: row.name,
          ...row.setup,
          updatedAt: row.updatedAt.toISOString(),
        }));
        return { text: JSON.stringify(videos, null, 2), data: videos };
      },
    },
    {
      name: 'get_video',
      title: 'Get video',
      description:
        'The timeline: frame size, duration and every clip (bottom layer first) with its start/end in seconds, trim, look and asset name. Read it before editing clips.',
      input: { videoId: videoIdField },
      readOnly: true,
      async run({ videoId }) {
        const project = await s.projects.get(videoId as string);
        const names = await assetNamesOf(s.assets, project.timeline);
        const data = {
          videoId,
          name: project.name,
          ...describeTimeline(project.timeline, names),
        };
        return { text: JSON.stringify(data, null, 2), data };
      },
    },
    {
      name: 'undo_video',
      title: 'Undo (video)',
      description: 'Reverts the most recent edit of a video.',
      input: { videoId: videoIdField },
      async run({ videoId }) {
        return {
          text: (await s.projects.undo(videoId as string))
            ? 'Undone'
            : 'Nothing to undo',
        };
      },
    },
    {
      name: 'redo_video',
      title: 'Redo (video)',
      description: 'Re-applies the last undone edit of a video.',
      input: { videoId: videoIdField },
      async run({ videoId }) {
        return {
          text: (await s.projects.redo(videoId as string))
            ? 'Redone'
            : 'Nothing to redo',
        };
      },
    },
  ];
}
