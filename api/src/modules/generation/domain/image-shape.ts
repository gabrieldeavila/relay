/** The frame shapes image models make well. */
export type ImageShape = 'square' | 'portrait' | 'landscape';

export const IMAGE_SHAPES: [ImageShape, ...ImageShape[]] = [
  'square',
  'portrait',
  'landscape',
];

/** Aspect ratios as most providers name them. */
export const ASPECT_RATIO: Record<ImageShape, string> = {
  square: '1:1',
  portrait: '3:4',
  landscape: '4:3',
};

/** "A gold 8 balloon" → "a-gold-8-balloon", for the asset's file name. */
export function nameFromPrompt(prompt: string): string {
  const slug = prompt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug || 'generated';
}
