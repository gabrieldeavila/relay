import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { imageSourceFor } from '../data/image-assets.js';
import type { ImageDocuments } from '../data/image-documents.js';
import { DEFAULT_MAX_SIDE, openImage } from '../data/open-image.js';
import { colorField } from './tools/tool-fields.js';

/** Tools that start or find image documents (the rest act on one by imageId). */
export function imageWorkspaceTools(documents: ImageDocuments): McpTool[] {
  return [
    {
      name: 'create_image',
      title: 'New image',
      description:
        'Starts a new image document with a single Background layer. Returns its imageId, which every image tool takes.',
      input: {
        name: z.string().default('Untitled image'),
        width: z.number().int().min(1).max(8192),
        height: z.number().int().min(1).max(8192),
        background: colorField('Background color, or "transparent"').default(
          '#ffffff',
        ),
      },
      async run(input) {
        const { name, ...setup } = input as {
          name: string;
          width: number;
          height: number;
          background: string;
        };
        const created = await documents.create(name, setup, 'mcp');
        return {
          text: `New ${setup.width}x${setup.height} image. imageId: ${created.id}. Active layer: ${created.engine.activeLayer}`,
          data: { imageId: created.id },
        };
      },
    },
    {
      name: 'open_image',
      title: 'Open photo',
      description:
        'Opens a photo as a new image document: the canvas takes the photo size and the photo goes on a "Photo" layer. Give an image asset, a local file path (jpg, png, webp, gif, avif; ~ allowed) or an http(s) URL. Edit non-destructively on top: adjustment layers with blend modes, masks, and filters on duplicates.',
      input: {
        assetId: z.string().optional(),
        path: z
          .string()
          .optional()
          .describe('Local image file, e.g. "~/Pictures/me.jpg"'),
        url: z.string().optional().describe('http(s) URL or data:image URI'),
        maxSide: z
          .number()
          .int()
          .min(64)
          .max(8192)
          .default(DEFAULT_MAX_SIDE)
          .describe('Big photos are scaled down to this longest side'),
      },
      async run(input) {
        const { maxSide, ...media } = input as {
          maxSide: number;
          assetId?: string;
          path?: string;
          url?: string;
        };
        const image = await imageSourceFor(documents.assets, media);
        const name = image.asset.name.replace(/\.\w+$/, '');
        const created = await documents.create(
          name,
          {
            width: image.width,
            height: image.height,
            background: 'transparent',
          },
          'mcp',
        );
        const opened = await openImage(created.engine, image, 'mcp', maxSide);
        const note = opened.scaled
          ? ` (scaled down from ${image.width}x${image.height})`
          : '';
        return {
          text: `Opened ${opened.width}x${opened.height}${note} as imageId ${created.id}. The photo is on layer_1 "Photo". Call render_image to look at it.`,
          data: { imageId: created.id, ...opened },
        };
      },
    },
    {
      name: 'list_images',
      title: 'List images',
      description: 'Image documents, most recently edited first.',
      input: {},
      readOnly: true,
      async run() {
        const images = (await documents.list()).map((doc) => ({
          imageId: doc.id,
          name: doc.name,
          width: doc.setup.width,
          height: doc.setup.height,
          edits: doc.edits,
          updatedAt: doc.updatedAt.toISOString(),
        }));
        return { text: JSON.stringify(images, null, 2), data: images };
      },
    },
  ];
}
