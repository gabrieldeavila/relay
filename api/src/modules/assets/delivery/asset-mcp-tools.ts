import { z } from 'zod';
import { publicUrl } from '../../../public-url.js';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { AssetStore } from '../data/asset-store.js';
import { describeAsset } from '../domain/describe-asset.js';

/** Bringing files into Relay and finding them again. */
export function assetMcpTools(store: AssetStore): McpTool[] {
  return [
    {
      name: 'import_media',
      title: 'Import media',
      description:
        'Brings a photo, video or audio file into Relay as an asset (copied, so the original is never changed) and tells its size, duration and whether it has sound. Give a local path (~ allowed) or an http(s) URL. Tools that take files also accept a path directly; import first when you want to inspect a file before using it.',
      input: {
        path: z.string().optional().describe('e.g. "~/Movies/trip.mov"'),
        url: z.string().optional(),
      },
      async run({ path, url }) {
        if (!path === !url) throw new Error('Pass exactly one of path or url');
        const asset = path
          ? await store.importPath(path as string)
          : await store.importUrl(url as string);
        const data = describeAsset(asset, publicUrl());
        return { text: JSON.stringify(data, null, 2), data };
      },
    },
    {
      name: 'list_assets',
      title: 'List assets',
      description:
        'Media files Relay has: imported ones and exports (images from export_image, videos from export_video), newest first.',
      input: {
        kind: z.enum(['image', 'video', 'audio']).optional(),
        limit: z.number().int().min(1).max(200).default(30),
      },
      readOnly: true,
      async run({ kind, limit }) {
        const assets = await store.list(
          kind as 'image' | 'video' | 'audio' | undefined,
          limit as number,
        );
        const data = assets.map((asset) => describeAsset(asset, publicUrl()));
        return { text: JSON.stringify(data, null, 2), data };
      },
    },
  ];
}
