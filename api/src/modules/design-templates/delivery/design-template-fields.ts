import { z } from 'zod';

const stepField = z.object({
  tool: z.string().describe('An image tool, as in batch_image'),
  input: z.record(z.string(), z.unknown()).default({}),
  when: z.string().optional().describe('Only run when this field is given'),
  unless: z
    .string()
    .optional()
    .describe(
      'Only run when this field is NOT given (e.g. a photo placeholder)',
    ),
});

const designField = z.object({
  kind: z.enum(['text', 'image', 'color']),
  label: z.string().min(1),
  default: z.string().optional().describe('Required for text and color fields'),
});

/** Input of save_design_template. */
export const SAVE_DESIGN_INPUT = {
  name: z.string().min(1).describe('e.g. "my podcast cover"'),
  description: z.string().min(1),
  category: z
    .string()
    .min(1)
    .describe(
      'e.g. instagram-post, instagram-story, youtube-thumbnail, poster, banner',
    ),
  width: z.number().int().min(1).max(8192),
  height: z.number().int().min(1).max(8192),
  background: z.string().default('#ffffff'),
  fonts: z
    .array(z.object({ family: z.string(), weights: z.array(z.string()) }))
    .default([])
    .describe('Google Fonts the design uses; downloaded when needed'),
  fields: z
    .record(z.string(), designField)
    .describe('What the person can change, by key, e.g. {"title": {...}}'),
  steps: z
    .array(stepField)
    .min(1)
    .max(200)
    .describe(
      'Image tool calls that draw the design, as in batch_image. Put "{{key}}" in strings for field values (an asset id for image fields: place_image assetId). Put each element on its own named layer (add_layer).',
    ),
};
