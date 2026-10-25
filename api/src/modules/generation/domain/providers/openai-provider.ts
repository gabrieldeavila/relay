import type { ImageShape } from '../image-shape.js';
import type { ProviderSpec } from '../provider-spec.js';

const SIZE: Record<ImageShape, string> = {
  square: '1024x1024',
  portrait: '1024x1536',
  landscape: '1536x1024',
};

interface Reply {
  data?: { b64_json?: string; url?: string }[];
}

/** OpenAI Images API (`/images/generations`); the GPT image models can be transparent. */
export const openaiProvider: ProviderSpec = {
  id: 'openai',
  label: 'OpenAI',
  keyVariable: 'OPENAI_API_KEY',
  defaultModel: 'gpt-image-1',
  defaultBaseUrl: 'https://api.openai.com/v1',
  canBeTransparent: true,
  call: (config, request, prompt) => ({
    method: 'POST',
    url: `${config.baseUrl}/images/generations`,
    headers: { authorization: `Bearer ${config.apiKey}` },
    body: {
      model: config.model,
      prompt,
      size: SIZE[request.shape],
      quality: request.quality,
      background: request.transparent ? 'transparent' : 'opaque',
      output_format: 'png',
      n: 1,
    },
  }),
  readReply(json) {
    const [image] = (json as Reply).data ?? [];
    if (image?.b64_json) return { kind: 'image', base64: image.b64_json };
    if (image?.url) return { kind: 'url', url: image.url };
    return { kind: 'failed', reason: 'OpenAI returned no image' };
  },
};
