import type { StepError } from '../../engine/domain/step-error.js';

/** What nodemailer errors carry that matters for deciding a retry. */
export interface SmtpErrorInfo {
  code?: string;
  responseCode?: number;
  message: string;
}

const NETWORK_CODES = new Set([
  'ECONNECTION',
  'ETIMEDOUT',
  'ESOCKET',
  'EDNS',
  'ECONNREFUSED',
  'ECONNRESET',
]);

/**
 * Wrong password or a refused address will fail the same way again; a busy or
 * unreachable server (or an SMTP 4xx, "try later") is worth another attempt.
 */
export function classifySmtpError({
  code,
  responseCode,
  message,
}: SmtpErrorInfo): StepError {
  if (code === 'EAUTH') {
    return {
      kind: 'invalid',
      message: `The email server refused the user name or password: ${message}`,
    };
  }
  if (code === 'EENVELOPE') return { kind: 'invalid', message };
  if (responseCode !== undefined && responseCode >= 500) {
    return { kind: 'invalid', message };
  }
  if (responseCode !== undefined && responseCode >= 400) {
    return { kind: 'http', status: 503, message };
  }
  if (code && NETWORK_CODES.has(code)) return { kind: 'network', message };
  return { kind: 'unknown', message };
}
