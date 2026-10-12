import { isRetryable } from '../../engine/domain/step-error.js';
import { classifyAiError } from './classify-ai-error.js';
import { claudeRequest, FALLBACK_BETA } from './claude-request.js';
import { readReply } from './read-reply.js';

describe('claudeRequest', () => {
  it('asks with the prompt, instructions and an explicit effort', () => {
    expect(
      claudeRequest({
        prompt: 'Summarize',
        instructions: '  Be brief ',
        model: 'claude-opus-5-5',
      }),
    ).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 16_000,
      output_config: { effort: 'medium' },
      system: 'Be brief',
      messages: [{ role: 'user', content: 'Summarize' }],
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
    });
  });

  it('leaves out empty instructions and fallbacks Haiku does not have', () => {
    const request = claudeRequest({
      prompt: 'Hi',
      instructions: ' ',
      model: 'claude-haiku-5-5',
    });
    expect(request).not.toHaveProperty('system');
    expect(request).not.toHaveProperty('fallbacks');
    expect(request).not.toHaveProperty('betas');
  });
});

describe('readReply', () => {
  it('joins the text blocks and skips thinking', () => {
    expect(
      readReply({
        stop_reason: 'end_turn',
        content: [
          { type: 'thinking' },
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world' },
        ],
      }),
    ).toEqual({ ok: true, text: 'Hello world', truncated: false });
  });

  it('flags text cut by the length limit', () => {
    expect(
      readReply({
        stop_reason: 'max_tokens',
        content: [{ type: 'text', text: 'Part' }],
      }),
    ).toMatchObject({ truncated: true });
  });

  it('reports a refusal with its explanation', () => {
    expect(
      readReply({
        stop_reason: 'refusal',
        stop_details: { explanation: 'Not allowed' },
        content: [],
      }),
    ).toEqual({ ok: false, reason: 'refusal', explanation: 'Not allowed' });
  });
});

describe('classifyAiError', () => {
  it('does not retry a refused key or a bad request', () => {
    expect(isRetryable(classifyAiError(401, 'invalid x-api-key'))).toBe(false);
    expect(isRetryable(classifyAiError(400, 'bad'))).toBe(false);
  });

  it('retries rate limits, overload and lost connections', () => {
    expect(isRetryable(classifyAiError(429, 'slow down'))).toBe(true);
    expect(isRetryable(classifyAiError(529, 'overloaded'))).toBe(true);
    expect(isRetryable(classifyAiError(undefined, 'ECONNRESET'))).toBe(true);
  });
});
