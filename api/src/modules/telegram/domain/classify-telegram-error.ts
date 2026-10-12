import type { StepError } from '../../engine/domain/step-error.js';

/**
 * Bot API failures as step errors, with the fixes people need for the common
 * ones: a refused token, or a chat the bot cannot write to yet.
 */
export function classifyTelegramError(
  status: number,
  description: string,
): StepError {
  if (status === 401) {
    return { kind: 'invalid', message: 'Telegram refused the bot token' };
  }
  if (status === 400 && /chat not found/i.test(description)) {
    return {
      kind: 'invalid',
      message:
        'Telegram chat not found: send any message to your bot first, or add the bot to the group or channel',
    };
  }
  if (status === 403) {
    return {
      kind: 'invalid',
      message: `The bot cannot write to this chat (${description}): add it to the group or unblock it`,
    };
  }
  return { kind: 'http', status, message: `Telegram: ${description}` };
}
