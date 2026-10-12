import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { classifyAiError } from '../domain/classify-ai-error.js';
import { claudeRequest, type AiPrompt } from '../domain/claude-request.js';
import { readReply } from '../domain/read-reply.js';

export interface AiAnswer {
  text: string;
  truncated: boolean;
  /** The model that answered (a fallback model after a refusal). */
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Claude through the official SDK. Its own retries are off: the engine already
 * retries the step with backoff, and twice would multiply the wait.
 */
@Injectable()
export class ClaudeClient {
  async ask(
    apiKey: string,
    prompt: AiPrompt,
    signal: AbortSignal,
  ): Promise<AiAnswer> {
    const reply = await this.client(apiKey)
      .beta.messages.create(claudeRequest(prompt), { signal })
      .catch((error: unknown) => {
        throw toStepFailure(error);
      });
    const read = readReply(reply);
    if (!read.ok) {
      throw new StepFailure({
        kind: 'invalid',
        message: `Claude declined this request${read.explanation ? `: ${read.explanation}` : ''}`,
      });
    }
    return {
      text: read.text,
      truncated: read.truncated,
      model: reply.model,
      usage: {
        inputTokens: reply.usage.input_tokens,
        outputTokens: reply.usage.output_tokens,
      },
    };
  }

  /** Cheapest call that proves the key works. */
  async check(apiKey: string): Promise<void> {
    await this.client(apiKey).models.list({ limit: 1 });
  }

  private client(apiKey: string) {
    return new Anthropic({ apiKey, maxRetries: 0 });
  }
}

function toStepFailure(error: unknown): unknown {
  if (error instanceof Anthropic.APIConnectionError) {
    return new StepFailure(classifyAiError(undefined, error.message));
  }
  if (error instanceof Anthropic.APIError) {
    return new StepFailure(
      classifyAiError(error.status as number | undefined, error.message),
    );
  }
  return error;
}
