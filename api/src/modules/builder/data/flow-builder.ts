import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import {
  builderSystemPrompt,
  describeRequest,
  repairRequest,
} from '../domain/builder-prompt.js';
import { draftFlow, type DraftResult } from '../domain/draft-flow.js';
import { PLAN_ANSWER_SCHEMA } from '../domain/plan-answer.js';
import { ClaudeConversation } from './claude-conversation.js';
import { PlanChecker } from './plan-checker.js';

/** The builder runs on the user's own Anthropic API key. */
export class NoAiAccount extends Error {
  constructor() {
    super('Set up an Anthropic API key in Connections first');
  }
}

/**
 * "Describe what you want": Claude drafts the flow from the user's catalog
 * with the user's own API key, and Relay checks each draft the way
 * publishing would before showing it.
 */
@Injectable()
export class FlowBuilder {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly checker: PlanChecker,
  ) {}

  async draft(ownerId: string, description: string): Promise<DraftResult> {
    const account = await this.accounts.find(ownerId, 'ai');
    if (!account) throw new NoAiAccount();
    const { catalog, check } = await this.checker.forOwner(ownerId);
    const conversation = new ClaudeConversation(
      account.secret,
      builderSystemPrompt(catalog),
      PLAN_ANSWER_SCHEMA,
    );
    return draftFlow({
      ask: (problems) =>
        conversation.say(
          problems ? repairRequest(problems) : describeRequest(description),
        ),
      check,
    });
  }
}
