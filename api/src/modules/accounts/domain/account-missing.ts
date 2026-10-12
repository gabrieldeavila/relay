import { StepFailure } from '../../nodes/domain/step-failure.js';
import type { AccountKind } from './account-kinds.js';

const NAMES: Record<AccountKind, string> = {
  email: 'an email account',
  telegram: 'a Telegram bot',
  ai: 'an Anthropic API key',
};

/** Trying again would not help until the user sets the account up. */
export const accountMissing = (kind: AccountKind) =>
  new StepFailure({
    kind: 'invalid',
    message: `Set up ${NAMES[kind]} in Connections first`,
  });
