import { ASPECT_RATIO } from '../image-shape.js';
import type { ProviderSpec } from '../provider-spec.js';

interface Reply {
  candidates?: {
    content?: { parts?: { inlineData?: { data?: string }; text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/** Google Gemini image models through the Gemini API (`generateContent`). */
export const geminiProvider: ProviderSpec = {
  id: 'gemini',
  label: 'Google Gemini',
  keyVariable: 'GEMINI_API_KEY',
  defaultModel: 'gemini-2.5-flash-image',
  defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  canBeTransparent: false,
  call: (config, request, prompt) => ({
    method: 'POST',
    url: `${config.baseUrl}/models/${config.model}:generateContent`,
    headers: { 'x-goog-api-key': config.apiKey },
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: ASPECT_RATIO[request.shape] },
      },
    },
  }),
  readReply(json) {
    const reply = json as Reply;
    const blocked = reply.promptFeedback?.blockReason;
    if (blocked)
      return {
        kind: 'failed',
        reason: `Gemini blocked the prompt (${blocked})`,
      };
    const [candidate] = reply.candidates ?? [];
    const parts = candidate?.content?.parts ?? [];
    const image = parts.find((part) => part.inlineData?.data);
    if (image) return { kind: 'image', base64: image.inlineData!.data! };
    const said = parts.find((part) => part.text)?.text;
    return {
      kind: 'failed',
      reason:
        said ??
        `Gemini returned no image (${candidate?.finishReason ?? 'no reason given'})`,
    };
  },
};
