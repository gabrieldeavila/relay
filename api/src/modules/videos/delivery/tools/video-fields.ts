import { z } from 'zod';

export const boxField = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .describe('Area in video pixels, origin top-left');

export const fitField = z
  .enum(['cover', 'contain'])
  .describe('cover = fill the area, cropping; contain = fit inside it');

export const layerField = z
  .number()
  .int()
  .min(0)
  .describe('Higher layers draw on top. 0 = main track');

export const clipTimingFields = {
  fadeIn: z.number().min(0).default(0).describe('Seconds of fade in'),
  fadeOut: z.number().min(0).default(0).describe('Seconds of fade out'),
  opacity: z.number().min(0).max(1).default(1),
};

export const colorText = (help: string) =>
  z.string().describe(`${help}. CSS color, e.g. "#ffffff"`);

/** Text look; same font rules as the image tools (load_font for Google Fonts). */
export const textStyleFields = {
  font: z
    .string()
    .describe('CSS font family list, e.g. "Bebas Neue, Impact, sans-serif"'),
  size: z
    .number()
    .positive()
    .describe('Font size in pixels (largest size with fit="shrink")'),
  weight: z.enum([
    'normal',
    'bold',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ]),
  color: colorText('Text color'),
  align: z.enum(['left', 'center', 'right']),
  verticalAlign: z.enum(['top', 'middle', 'bottom']),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
  stroke: colorText('Outline color').nullable(),
  strokeWidth: z.number().min(0),
  background: colorText('Color filling the box behind the text').nullable(),
  fit: z
    .enum(['none', 'shrink'])
    .describe('"shrink" lowers the size until the text fits the box'),
};

export const videoIdField = z
  .string()
  .describe('The video to edit (from create_video or list_videos)');

export const clipIdField = z
  .string()
  .describe('Clip id from get_video, e.g. "clip_3"');

export const highlightField = z
  .object({
    word: z
      .number()
      .int()
      .min(0)
      .describe('Which word, 0-based, counting words separated by spaces'),
    color: colorText('Color of that word'),
    background: colorText('A rounded box behind the word')
      .nullable()
      .default(null),
  })
  .describe('Draws one word differently, e.g. the word being spoken');
