import { errorReason } from './error-reason.js';
import { promptFor } from './generate-request.js';
import { readGenerationConfig } from './generation-config.js';
import { nameFromPrompt } from './image-shape.js';

describe('readGenerationConfig', () => {
  it('is off when no provider is set', () => {
    expect(readGenerationConfig({})).toBeNull();
    expect(readGenerationConfig({ OPENAI_API_KEY: 'sk-1' })).toBeNull();
  });

  it("reads each provider's own key and defaults", () => {
    expect(
      readGenerationConfig({
        IMAGE_AI_PROVIDER: 'OpenAI',
        OPENAI_API_KEY: ' sk-1 ',
      }),
    ).toEqual({
      provider: 'openai',
      apiKey: 'sk-1',
      model: 'gpt-image-1',
      baseUrl: 'https://api.openai.com/v1',
    });
    expect(
      readGenerationConfig({
        IMAGE_AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'g',
      }),
    ).toMatchObject({ provider: 'gemini', model: 'gemini-2.5-flash-image' });
    expect(
      readGenerationConfig({
        IMAGE_AI_PROVIDER: 'replicate',
        REPLICATE_API_TOKEN: 'r',
      }),
    ).toMatchObject({ model: 'black-forest-labs/flux-schnell' });
    expect(
      readGenerationConfig({
        IMAGE_AI_PROVIDER: 'fal',
        FAL_KEY: 'f',
        IMAGE_AI_MODEL: 'fal-ai/flux-pro',
        IMAGE_AI_BASE_URL: 'http://127.0.0.1:9999/',
      }),
    ).toMatchObject({
      model: 'fal-ai/flux-pro',
      baseUrl: 'http://127.0.0.1:9999',
    });
  });

  it('explains a half-done setup instead of silently turning off', () => {
    expect(() => readGenerationConfig({ IMAGE_AI_PROVIDER: 'gemini' })).toThrow(
      'needs GEMINI_API_KEY',
    );
    expect(() =>
      readGenerationConfig({ IMAGE_AI_PROVIDER: 'midjourney' }),
    ).toThrow('Use one of openai, gemini, replicate, fal');
  });
});

describe('promptFor', () => {
  const request = {
    prompt: 'A gold balloon',
    shape: 'square' as const,
    transparent: true,
    quality: 'medium' as const,
  };

  it('asks for a plain background only when transparency is wanted but missing', () => {
    expect(promptFor(request, true)).toBe('A gold balloon');
    expect(promptFor({ ...request, transparent: false }, false)).toBe(
      'A gold balloon',
    );
    expect(promptFor(request, false)).toContain('plain solid white background');
  });
});

describe('errorReason', () => {
  it('finds the message in the shapes providers use', () => {
    expect(errorReason({ error: { message: 'Bad key' } }, 401)).toBe('Bad key');
    expect(errorReason({ error: 'Quota exceeded' }, 429)).toBe(
      'Quota exceeded',
    );
    expect(errorReason({ detail: 'Invalid token' }, 401)).toBe('Invalid token');
    expect(errorReason({ detail: [{ msg: 'prompt is required' }] }, 422)).toBe(
      'prompt is required',
    );
    expect(errorReason(null, 500)).toBe('HTTP 500');
  });
});

describe('nameFromPrompt', () => {
  it('makes a short file-safe name', () => {
    expect(nameFromPrompt('A gold "8" balloon, shiny!')).toBe(
      'a-gold-8-balloon-shiny',
    );
    expect(nameFromPrompt('Pão de açúcar ao pôr do sol')).toBe(
      'pao-de-acucar-ao-por-do-sol',
    );
    expect(nameFromPrompt('!!!')).toBe('generated');
    expect(nameFromPrompt('word '.repeat(20)).length).toBeLessThanOrEqual(40);
  });
});
