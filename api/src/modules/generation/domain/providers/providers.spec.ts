import type { GenerateRequest } from '../generate-request.js';
import type { GenerationConfig, ProviderId } from '../provider-spec.js';
import { PROVIDERS } from './provider-catalog.js';

const request: GenerateRequest = {
  prompt: 'a balloon',
  shape: 'portrait',
  transparent: true,
  quality: 'high',
};

const configFor = (provider: ProviderId): GenerationConfig => ({
  provider,
  apiKey: 'KEY',
  model: PROVIDERS[provider].defaultModel,
  baseUrl: PROVIDERS[provider].defaultBaseUrl,
});

const callOf = (provider: ProviderId) =>
  PROVIDERS[provider].call(configFor(provider), request, 'the prompt');
const read = (provider: ProviderId, json: unknown) =>
  PROVIDERS[provider].readReply(json, configFor(provider));

describe('openai', () => {
  it('asks for a transparent PNG at the shape size', () => {
    expect(callOf('openai')).toEqual({
      method: 'POST',
      url: 'https://api.openai.com/v1/images/generations',
      headers: { authorization: 'Bearer KEY' },
      body: expect.objectContaining({
        model: 'gpt-image-1',
        prompt: 'the prompt',
        size: '1024x1536',
        quality: 'high',
        background: 'transparent',
        output_format: 'png',
      }) as unknown,
    });
  });

  it('reads base64 or a link', () => {
    expect(read('openai', { data: [{ b64_json: 'AAA' }] })).toEqual({
      kind: 'image',
      base64: 'AAA',
    });
    expect(read('openai', { data: [{ url: 'https://x/y.png' }] })).toEqual({
      kind: 'url',
      url: 'https://x/y.png',
    });
    expect(read('openai', {})).toMatchObject({ kind: 'failed' });
  });
});

describe('gemini', () => {
  it('asks generateContent for an image only, with the aspect ratio', () => {
    const call = callOf('gemini');
    expect(call.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    );
    expect(call.headers).toEqual({ 'x-goog-api-key': 'KEY' });
    expect(call.body).toEqual({
      contents: [{ parts: [{ text: 'the prompt' }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '3:4' },
      },
    });
  });

  it('finds the inline image, or explains why there is none', () => {
    const parts = [
      { text: 'Here you go' },
      { inlineData: { mimeType: 'image/png', data: 'BBB' } },
    ];
    expect(read('gemini', { candidates: [{ content: { parts } }] })).toEqual({
      kind: 'image',
      base64: 'BBB',
    });
    expect(
      read('gemini', { promptFeedback: { blockReason: 'SAFETY' } }),
    ).toEqual({
      kind: 'failed',
      reason: 'Gemini blocked the prompt (SAFETY)',
    });
    expect(
      read('gemini', {
        candidates: [{ content: { parts: [{ text: 'I cannot draw that' }] } }],
      }),
    ).toEqual({
      kind: 'failed',
      reason: 'I cannot draw that',
    });
  });
});

describe('replicate', () => {
  it('starts a prediction on the model, waiting for it', () => {
    const call = callOf('replicate');
    expect(call.url).toBe(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    );
    expect(call.headers).toEqual({
      authorization: 'Bearer KEY',
      prefer: 'wait',
    });
    expect(call.body).toEqual({
      input: {
        prompt: 'the prompt',
        aspect_ratio: '3:4',
        output_format: 'png',
      },
    });
  });

  it('reads the output link, polls while running, and reports failures', () => {
    expect(
      read('replicate', { status: 'succeeded', output: ['https://r/1.png'] }),
    ).toEqual({
      kind: 'url',
      url: 'https://r/1.png',
    });
    expect(
      read('replicate', { status: 'succeeded', output: 'https://r/2.png' }),
    ).toEqual({
      kind: 'url',
      url: 'https://r/2.png',
    });
    expect(
      read('replicate', {
        status: 'processing',
        urls: { get: 'https://api/p/1' },
      }),
    ).toEqual({
      kind: 'pending',
      poll: {
        method: 'GET',
        url: 'https://api/p/1',
        headers: { authorization: 'Bearer KEY' },
      },
    });
    expect(
      read('replicate', { status: 'failed', error: 'NSFW content detected' }),
    ).toEqual({
      kind: 'failed',
      reason: 'NSFW content detected',
    });
  });
});

describe('fal', () => {
  it('calls the model synchronously with an image size', () => {
    const call = callOf('fal');
    expect(call.url).toBe('https://fal.run/fal-ai/flux/schnell');
    expect(call.headers).toEqual({ authorization: 'Key KEY' });
    expect(call.body).toMatchObject({
      prompt: 'the prompt',
      image_size: 'portrait_4_3',
    });
  });

  it('reads a link or an inlined data URI', () => {
    expect(read('fal', { images: [{ url: 'https://fal/1.png' }] })).toEqual({
      kind: 'url',
      url: 'https://fal/1.png',
    });
    expect(
      read('fal', { images: [{ url: 'data:image/png;base64,CCC' }] }),
    ).toEqual({ kind: 'image', base64: 'CCC' });
    expect(read('fal', {})).toMatchObject({ kind: 'failed' });
  });
});

describe('catalog', () => {
  it('only OpenAI promises transparency', () => {
    const transparent = Object.values(PROVIDERS).filter(
      (spec) => spec.canBeTransparent,
    );
    expect(transparent.map((spec) => spec.id)).toEqual(['openai']);
  });
});
