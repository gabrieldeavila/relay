import type { ImageShape } from '../image-shape.js';
import type { ProviderSpec } from '../provider-spec.js';

const IMAGE_SIZE: Record<ImageShape, string> = {
  square: 'square_hd',
  portrait: 'portrait_4_3',
  landscape: 'landscape_4_3',
};

interface Reply {
  images?: { url?: string }[];
}

/** fal.ai models that take prompt + image_size (e.g. FLUX), called synchronously. */
export const falProvider: ProviderSpec = {
  id: 'fal',
  label: 'fal.ai',
  keyVariable: 'FAL_KEY',
  defaultModel: 'fal-ai/flux/schnell',
  defaultBaseUrl: 'https://fal.run',
  canBeTransparent: false,
  call: (config, request, prompt) => ({
    method: 'POST',
    url: `${config.baseUrl}/${config.model}`,
    headers: { authorization: `Key ${config.apiKey}` },
    body: {
      prompt,
      image_size: IMAGE_SIZE[request.shape],
      num_images: 1,
      output_format: 'png',
    },
  }),
  readReply(json) {
    const url = (json as Reply).images?.[0]?.url;
    if (!url) return { kind: 'failed', reason: 'fal.ai returned no image' };
    // Some fal models answer with the image inlined as a data: URI.
    const inline = /^data:image\/[\w+.-]+;base64,(.*)$/s.exec(url);
    return inline ? { kind: 'image', base64: inline[1] } : { kind: 'url', url };
  },
};
