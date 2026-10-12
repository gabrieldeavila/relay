import { basename } from 'node:path';
import type { AccountSettings } from '../../accounts/domain/account-kinds.js';

export interface EmailRequest {
  /** Already-parsed recipients; empty sends it to the account itself. */
  to: string[];
  subject: string;
  text: string;
  /** Absolute path of a local file, e.g. a picture an earlier step made. */
  attachment?: string;
}

export interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  text: string;
  attachments: { filename: string; path: string }[];
  /**
   * The same on every retry of the step, so mail apps that see the message
   * twice (sent, then the step was interrupted) can show it once.
   */
  messageId: string;
}

export function buildEmail(
  request: EmailRequest,
  account: AccountSettings['email'],
  idempotencyKey: string,
): EmailMessage {
  const from = account.from || account.user;
  return {
    from,
    to: request.to.length ? request.to : [account.user],
    subject: request.subject,
    text: request.text,
    attachments: request.attachment
      ? [{ filename: basename(request.attachment), path: request.attachment }]
      : [],
    messageId: `<${idempotencyKey.split(':').slice(0, 2).join('.')}@relay.local>`,
  };
}
