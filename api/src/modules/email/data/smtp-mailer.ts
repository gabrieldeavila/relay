import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import type { AccountCredentials } from '../../accounts/domain/account-kinds.js';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import type { EmailMessage } from '../domain/build-email.js';
import {
  classifySmtpError,
  type SmtpErrorInfo,
} from '../domain/classify-smtp-error.js';

export interface SentEmail {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

/** Sends through the user's own SMTP server (Gmail, Outlook, their provider). */
@Injectable()
export class SmtpMailer {
  async send(
    account: AccountCredentials<'email'>,
    message: EmailMessage,
  ): Promise<SentEmail> {
    const transport = transportFor(account);
    try {
      const info = await transport.sendMail(message);
      return {
        messageId: info.messageId,
        accepted: info.accepted.map(String),
        rejected: info.rejected.map(String),
      };
    } catch (error) {
      throw new StepFailure(classifySmtpError(error as SmtpErrorInfo));
    } finally {
      transport.close();
    }
  }

  /** Signs in without sending anything; throws with the server's answer. */
  async verify(account: AccountCredentials<'email'>): Promise<void> {
    const transport = transportFor(account);
    try {
      await transport.verify();
    } finally {
      transport.close();
    }
  }
}

function transportFor({ settings, secret }: AccountCredentials<'email'>) {
  return createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: secret },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
  });
}
