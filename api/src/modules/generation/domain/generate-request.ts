import type { ImageShape } from './image-shape.js';

export interface GenerateRequest {
  prompt: string;
  shape: ImageShape;
  /** Ask for a transparent background (only some providers can). */
  transparent: boolean;
  quality: 'low' | 'medium' | 'high';
}

/** Providers without transparency get a plain background that is easy to remove. */
export function promptFor(request: GenerateRequest, canBeTransparent: boolean) {
  if (!request.transparent || canBeTransparent) return request.prompt;
  return `${request.prompt}. Isolated on a plain solid white background, no shadow, no scenery.`;
}
