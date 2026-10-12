import Anthropic from '@anthropic-ai/sdk';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { classifyAiError } from '../../ai/domain/classify-ai-error.js';
import { FALLBACK_BETA } from '../../ai/domain/claude-request.js';
import { readReply } from '../../ai/domain/read-reply.js';

const MODEL = 'claude-opus-5-5';

/**
 * A back-and-forth with Claude whose answers follow one JSON Schema. Replies
 * are appended unchanged (append-only history), and the system prompt is
 * cached, since every repair round resends it.
 */
export class ClaudeConversation {
  private readonly client: Anthropic;
  private readonly messages: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(
    apiKey: string,
    private readonly system: string,
    private readonly schema: Record<string, unknown>,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 1 });
  }

  /** Claude's JSON answer to the next user message. */
  async say(text: string): Promise<string> {
    this.messages.push({ role: 'user', content: text });
    const reply = await this.client.beta.messages
      .create({
        model: MODEL,
        max_tokens: 16_000,
        system: this.system,
        cache_control: { type: 'ephemeral' },
        messages: this.messages,
        output_config: {
          effort: 'high',
          format: { type: 'json_schema', schema: this.schema },
        },
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
      })
      .catch((error: unknown) => {
        throw toFailure(error);
      });
    this.messages.push({ role: 'assistant', content: reply.content });
    const read = readReply(reply);
    if (!read.ok) {
      throw new StepFailure({
        kind: 'invalid',
        message: `Claude declined this request${read.explanation ? `: ${read.explanation}` : ''}`,
      });
    }
    return read.text;
  }
}

function toFailure(error: unknown): unknown {
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
