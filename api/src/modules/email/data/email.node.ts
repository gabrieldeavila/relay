import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { requireLocalFile } from '../../files/data/local-file.js';
import { defineNode } from '../../nodes/domain/node-definition.js';
import { done } from '../../nodes/domain/node-result.js';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { buildEmail } from '../domain/build-email.js';
import { parseRecipients } from '../domain/parse-recipients.js';
import { SmtpMailer } from './smtp-mailer.js';

/** Attachments bigger than this are refused by most mail servers anyway. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** Output: `{ messageId, to, accepted, rejected }`. */
@Injectable()
export class EmailNode {
  readonly definition = defineNode({
    type: 'email.send',
    kind: 'action',
    title: 'Send an email',
    description:
      'Sends an email from your account, with an optional file attached.',
    config: z.object({
      to: z.string().default(''),
      subject: z.string().min(1),
      text: z.string().min(1).meta({ widget: 'textarea' }),
      attachment: z.string().optional(),
    }),
    output: '`{ messageId, to, accepted, rejected }`',
    outputPorts: ['out', 'error'],
    timeoutMs: 120_000,
    run: async ({ to, subject, text, attachment }, ctx) => {
      const recipients = parseRecipients(to);
      if (!recipients.ok) {
        throw new StepFailure({
          kind: 'invalid',
          message: `Not an email address: ${recipients.invalid.join(', ')}`,
        });
      }
      const file = attachment
        ? await requireLocalFile(attachment, MAX_ATTACHMENT_BYTES)
        : undefined;
      const account = await this.accounts.require(ctx.ownerId, 'email');
      const message = buildEmail(
        { to: recipients.addresses, subject, text, attachment: file?.path },
        account.settings,
        ctx.idempotencyKey,
      );
      const sent = await this.mailer.send(account, message);
      return done({ ...sent, to: message.to });
    },
  });

  constructor(
    private readonly accounts: AccountRepository,
    private readonly mailer: SmtpMailer,
  ) {}
}
