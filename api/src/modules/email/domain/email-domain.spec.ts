import { isRetryable } from '../../engine/domain/step-error.js';
import { buildEmail } from './build-email.js';
import { classifySmtpError } from './classify-smtp-error.js';
import { parseRecipients } from './parse-recipients.js';

describe('parseRecipients', () => {
  it('splits on commas, semicolons and lines, without repeats', () => {
    expect(parseRecipients('ana@x.com, bia@y.com;\nana@x.com ')).toEqual({
      ok: true,
      addresses: ['ana@x.com', 'bia@y.com'],
    });
  });

  it('is empty for blank text (send it to me)', () => {
    expect(parseRecipients('  ')).toEqual({ ok: true, addresses: [] });
  });

  it('names what is not an address', () => {
    expect(parseRecipients('ana@x.com, bia, caio@')).toEqual({
      ok: false,
      invalid: ['bia', 'caio@'],
    });
  });
});

describe('buildEmail', () => {
  const account = {
    host: 'smtp.x.com',
    port: 587,
    secure: false,
    user: 'me@x.com',
  };

  it('sends to the account itself when nobody is named', () => {
    const email = buildEmail(
      { to: [], subject: 'Hi', text: 'Body' },
      account,
      'run-1:send:2',
    );
    expect(email).toMatchObject({ from: 'me@x.com', to: ['me@x.com'] });
    expect(email.attachments).toEqual([]);
  });

  it('keeps the message id across attempts of the same step', () => {
    const first = buildEmail(
      { to: [], subject: 's', text: 't' },
      account,
      'r:n:1',
    );
    const retry = buildEmail(
      { to: [], subject: 's', text: 't' },
      account,
      'r:n:3',
    );
    expect(first.messageId).toBe(retry.messageId);
    expect(first.messageId).toBe('<r.n@relay.local>');
  });

  it('attaches a local file under its own name and uses the sender name', () => {
    const email = buildEmail(
      {
        to: ['a@b.co'],
        subject: 's',
        text: 't',
        attachment: '/tmp/run/render-1.png',
      },
      { ...account, from: 'Relay <me@x.com>' },
      'r:n:1',
    );
    expect(email.from).toBe('Relay <me@x.com>');
    expect(email.attachments).toEqual([
      { filename: 'render-1.png', path: '/tmp/run/render-1.png' },
    ]);
  });
});

describe('classifySmtpError', () => {
  const retryable = (info: Parameters<typeof classifySmtpError>[0]) =>
    isRetryable(classifySmtpError(info));

  it('does not retry a wrong password or a refused address', () => {
    expect(retryable({ code: 'EAUTH', message: '535' })).toBe(false);
    expect(retryable({ code: 'EENVELOPE', message: 'no recipients' })).toBe(
      false,
    );
    expect(
      retryable({ responseCode: 550, message: 'mailbox unavailable' }),
    ).toBe(false);
  });

  it('retries when the server is busy or unreachable', () => {
    expect(retryable({ responseCode: 421, message: 'try later' })).toBe(true);
    expect(retryable({ code: 'ECONNECTION', message: 'refused' })).toBe(true);
    expect(retryable({ message: 'odd' })).toBe(true);
  });
});
