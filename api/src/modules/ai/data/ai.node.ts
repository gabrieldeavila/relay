import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { defineNode } from '../../nodes/domain/node-definition.js';
import { done } from '../../nodes/domain/node-result.js';
import { AI_MODELS } from '../domain/claude-request.js';
import { ClaudeClient } from './claude-client.js';

/**
 * The prompt (with values from earlier steps) goes to Anthropic, so this is
 * the one step that sends data off the machine.
 * Output: `{ text, truncated, model, usage }`.
 */
@Injectable()
export class AiNode {
  readonly definition = defineNode({
    type: 'ai.generate',
    kind: 'action',
    title: 'Ask AI',
    description:
      'Claude writes, summarizes or answers using values from earlier steps.',
    config: z.object({
      prompt: z.string().min(1).meta({ widget: 'textarea' }),
      instructions: z.string().optional().meta({ widget: 'textarea' }),
      model: z.enum(AI_MODELS).default('claude-opus-5-5'),
    }),
    output: '`{ text, truncated, model, usage }`',
    outputPorts: ['out', 'error'],
    timeoutMs: 300_000,
    run: async (config, ctx) => {
      const { secret } = await this.accounts.require(ctx.ownerId, 'ai');
      return done(await this.claude.ask(secret, config, ctx.signal));
    },
  });

  constructor(
    private readonly accounts: AccountRepository,
    private readonly claude: ClaudeClient,
  ) {}
}
