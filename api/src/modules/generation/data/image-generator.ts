import type { GenerateRequest } from '../domain/generate-request.js';

/** Makes a PNG from a prompt with the image AI that is set up. */
export interface ImageGenerator {
  /** e.g. "OpenAI (gpt-image-1)", for messages. */
  label: string;
  canBeTransparent: boolean;
  generate(request: GenerateRequest): Promise<Buffer>;
}

/** Injection token; its value is null when generation is not set up. */
export const IMAGE_GENERATOR = 'IMAGE_GENERATOR';
