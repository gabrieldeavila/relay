import { z } from 'zod';
import { publicUrl } from '../../../public-url.js';
import type { AssetStore } from '../../assets/data/asset-store.js';
import { describeAsset } from '../../assets/domain/describe-asset.js';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { ImageGenerator } from '../data/image-generator.js';
import { IMAGE_SHAPES, nameFromPrompt } from '../domain/image-shape.js';

/** What the AI must do itself when the provider can't make a transparent background. */
const REMOVE_BACKGROUND_HINT =
  'Its background is plain white, not transparent (this image AI cannot make transparent images). To use it as a cut-out: place_image it on its own layer, select_color on the background with that layerId (tolerance ~30), clear_layer, then modify_selection deselect. Check the edges with render_image.';

const INPUT = {
  prompt: z
    .string()
    .min(3)
    .describe(
      'What to make, e.g. "a shiny gold foil balloon shaped like the number 8, studio light, front view"',
    ),
  shape: z.enum(IMAGE_SHAPES).default('square'),
  transparent: z
    .boolean()
    .default(true)
    .describe(
      'An element to place on other images; false for full scenes or backgrounds',
    ),
  quality: z
    .enum(['low', 'medium', 'high'])
    .default('medium')
    .describe('Only some image AIs use this'),
  name: z.string().optional().describe('Asset name, without extension'),
};

/** `generate_image`, only offered when an image AI is set up. */
export function generationMcpTools(
  generator: ImageGenerator | null,
  assets: Pick<AssetStore, 'saveBytes'>,
): McpTool[] {
  if (!generator) return [];
  const transparency = generator.canBeTransparent
    ? 'By default the background is transparent, so the result is a cut-out element.'
    : 'This image AI cannot make transparent backgrounds: with transparent=true you get the element on plain white, and the result explains how to remove it.';
  return [
    {
      name: 'generate_image',
      title: 'Generate image (AI)',
      description: `Makes a new picture from a description with ${generator.label} and saves it as an image asset. Use it for things that are hard to draw with shapes: realistic objects, stickers, props, textures, backgrounds. ${transparency} Then place_image it onto a layer and move, scale and grade it to match. Text inside generated images is unreliable; draw words with draw_text instead. Costs money per image, so describe exactly what you need and avoid retries for small details.`,
      input: INPUT,
      async run(input) {
        const { name, ...request } = z.object(INPUT).parse(input);
        const png = await generator.generate(request);
        const asset = await assets.saveBytes(
          png,
          'image/png',
          `${name ?? nameFromPrompt(request.prompt)}.png`,
          'generated',
        );
        const needsCutOut = request.transparent && !generator.canBeTransparent;
        const lines = [
          `Generated ${asset.width}x${asset.height} image as asset ${asset.id}. Put it on a layer with place_image (assetId), or in a video with add_clip.`,
          ...(needsCutOut ? [REMOVE_BACKGROUND_HINT] : []),
        ];
        return {
          text: lines.join('\n'),
          image: png,
          data: {
            ...describeAsset(asset, publicUrl()),
            transparent: !needsCutOut && request.transparent,
          },
        };
      },
    },
  ];
}
