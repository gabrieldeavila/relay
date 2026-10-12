import type { AddressInfo } from 'node:net';
import { SMTPServer } from 'smtp-server';

export interface ReceivedMail {
  from: string;
  to: string[];
  raw: string;
}

/** A local mail server that accepts one user and keeps what it receives. */
export class FakeSmtp {
  readonly received: ReceivedMail[] = [];
  private readonly server = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    allowInsecureAuth: true,
    onAuth: (auth, _session, callback) =>
      auth.username === this.user && auth.password === this.password
        ? callback(null, { user: auth.username })
        : callback(new Error('Invalid username or password')),
    onData: (stream, session, callback) => {
      let raw = '';
      stream.on('data', (chunk: Buffer) => (raw += chunk.toString()));
      stream.on('end', () => {
        this.received.push({
          from: session.envelope.mailFrom
            ? session.envelope.mailFrom.address
            : '',
          to: session.envelope.rcptTo.map((rcpt) => rcpt.address),
          raw,
        });
        callback();
      });
    },
  });

  constructor(
    readonly user = 'me@example.com',
    readonly password = 'right-password',
  ) {}

  get port() {
    return (this.server.server.address() as AddressInfo).port;
  }

  start() {
    return new Promise<void>((resolve) =>
      this.server.listen(0, '127.0.0.1', resolve),
    );
  }

  stop() {
    return new Promise<void>((resolve) => this.server.close(() => resolve()));
  }
}
