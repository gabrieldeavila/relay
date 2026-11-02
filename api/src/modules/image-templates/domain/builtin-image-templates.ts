import type { ImageTemplate, TemplateStep } from './image-template.js';

const filter = (name: string, amount: number): TemplateStep => ({
  tool: 'apply_filter',
  input: { layerId: '$layer', filter: name, amount },
});

/** A layer of one color blended over everything below, like a photo filter. */
const tint = (
  name: string,
  color: string,
  blendMode: string,
  opacity: number,
): TemplateStep[] => [
  { tool: 'add_layer', input: { name } },
  { tool: 'fill_layer', input: { color } },
  { tool: 'update_layer', input: { blendMode, opacity } },
];

/** Darkens the corners with a radial gradient on its own layer. */
const vignette = (darkness: number): TemplateStep[] => [
  { tool: 'add_layer', input: { name: 'Vignette' } },
  {
    tool: 'draw_gradient',
    input: {
      kind: 'radial',
      from: ['$cx', '$cy'],
      to: ['$width', '$height'],
      stops: [
        { offset: 0, color: 'rgba(0,0,0,0)' },
        { offset: 0.55, color: 'rgba(0,0,0,0)' },
        { offset: 0.8, color: `rgba(0,0,0,${darkness * 0.45})` },
        { offset: 1, color: `rgba(0,0,0,${darkness})` },
      ],
    },
  },
];

export const BUILTIN_IMAGE_TEMPLATES: ImageTemplate[] = [
  {
    name: 'black-white',
    description: 'Clean black and white with a little extra contrast',
    steps: [filter('grayscale', 1), filter('contrast', 0.12)],
  },
  {
    name: 'noir',
    description: 'Hard, moody black and white with dark corners',
    steps: [
      filter('grayscale', 1),
      filter('contrast', 0.18),
      filter('brightness', -0.03),
      ...vignette(0.7),
    ],
  },
  {
    name: 'vintage',
    description: 'Warm, faded old-photo look',
    steps: [
      filter('sepia', 0.35),
      filter('saturation', -0.2),
      filter('contrast', -0.1),
      ...tint('Warm tint', '#f4a261', 'soft-light', 0.25),
      ...vignette(0.4),
    ],
  },
  {
    name: 'faded-film',
    description: 'Low contrast with lifted, bluish blacks, like old film stock',
    steps: [
      filter('contrast', -0.15),
      filter('saturation', -0.25),
      ...tint('Lifted blacks', '#1e293b', 'lighten', 0.35),
    ],
  },
  {
    name: 'cinematic',
    description: 'Teal and orange movie grade with punchy contrast',
    steps: [
      filter('contrast', 0.08),
      filter('saturation', 0.1),
      ...tint('Teal shadows', '#0e7490', 'soft-light', 0.45),
      ...tint('Orange light', '#fb923c', 'overlay', 0.1),
      ...vignette(0.35),
    ],
  },
  {
    name: 'warm',
    description: 'Golden-hour warmth',
    steps: [
      filter('saturation', 0.1),
      ...tint('Warm tint', '#ff9f43', 'soft-light', 0.3),
    ],
  },
  {
    name: 'cool',
    description: 'Cold, blue-ish tones',
    steps: [
      filter('saturation', -0.05),
      ...tint('Cool tint', '#4dabf7', 'soft-light', 0.3),
    ],
  },
  {
    name: 'vivid',
    description: 'Bright colors and crisp detail for social posts',
    steps: [
      filter('saturation', 0.3),
      filter('contrast', 0.05),
      filter('sharpen', 0.3),
    ],
  },
  {
    name: 'dreamy',
    description: 'Soft glow over the photo',
    steps: [
      { tool: 'duplicate_layer', input: { layerId: '$layer' } },
      { tool: 'apply_filter', input: { filter: 'blur', amount: 10 } },
      { tool: 'update_layer', input: { blendMode: 'screen', opacity: 0.45 } },
    ],
  },
  {
    name: 'vignette',
    description: 'Only darkens the corners, colors stay as they are',
    steps: vignette(0.6),
  },
];
