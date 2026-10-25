import { z } from 'zod';
import {
  encodeImage,
  MIME_BY_FORMAT,
  writeCopy,
} from '../../data/export-image.js';
import { exportFormatOf } from '../../domain/document/export-format.js';
import { defineTool } from './tool-definition.js';
import { colorField } from './tool-fields.js';

export const exportTool = defineTool({
  name: 'export_image',
  title: 'Export image',
  description:
    'Saves the finished image at full resolution as a new asset (usable in videos with add_clip). The format: png keeps transparency, jpg is smaller (transparent areas get `background`), or webp. Pass path to also save a copy there (folders are created as needed).',
  input: {
    format: z.enum(['png', 'jpg', 'webp']).default('png'),
    name: z.string().default('image').describe('Asset name, without extension'),
    path: z
      .string()
      .optional()
      .describe(
        'Also save a copy here, e.g. "~/Desktop/post.png" (its extension wins over format)',
      ),
    quality: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(92)
      .describe('JPEG/WebP quality'),
    background: colorField('JPEG only: color behind transparent areas').default(
      '#ffffff',
    ),
    overwrite: z
      .boolean()
      .default(false)
      .describe('Replace the file at path if it already exists'),
  },
  readOnly: true,
  async run(
    { format, name, path, quality, background, overwrite },
    { engine, assets },
  ) {
    const chosen = path ? exportFormatOf(path) : exportFormatOf(`x.${format}`);
    const bytes = encodeImage(engine.doc, {
      format: chosen,
      quality,
      background,
    });
    const extension = chosen === 'jpeg' ? 'jpg' : chosen;
    const asset = await assets.saveBytes(
      bytes,
      MIME_BY_FORMAT[chosen],
      `${name}.${extension}`,
      'export',
    );
    const copy = path ? await writeCopy(path, bytes, overwrite) : null;
    const kb = Math.round(bytes.length / 1024);
    const where = copy ? ` and saved a copy to ${copy}` : '';
    return {
      text: `Exported ${engine.doc.meta.width}x${engine.doc.meta.height} ${extension} (${kb} KB) as asset ${asset.id}${where}`,
      data: {
        assetId: asset.id,
        path: copy ?? asset.path,
        bytes: bytes.length,
      },
    };
  },
});
