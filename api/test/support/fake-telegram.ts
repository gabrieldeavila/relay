import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface BotCall {
  token: string;
  method: string;
  contentType: string;
  /** JSON bodies parsed; multipart (photos) kept as text. */
  body: unknown;
}

/** The Bot API (`/bot<token>/<method>`) answering like Telegram does. */
export class FakeTelegram {
  readonly calls: BotCall[] = [];
  /** Methods that answer with an error, e.g. `{ sendMessage: [400, 'Bad Request: chat not found'] }`. */
  failures: Record<string, [number, string]> = {};
  updates: unknown[] = [];
  private nextId = 100;
  private server?: Server;

  get url() {
    return `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
  }

  start() {
    this.server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk: Buffer) => (raw += chunk.toString('latin1')));
      req.on('end', () => {
        const [, token, method] = req.url?.match(/^\/bot([^/]+)\/(\w+)$/) ?? [];
        const contentType = req.headers['content-type'] ?? '';
        this.calls.push({
          token,
          method,
          contentType,
          body: contentType.includes('json') ? JSON.parse(raw) : raw,
        });
        const failure = this.failures[method];
        const [status, body] = failure
          ? [
              failure[0],
              { ok: false, error_code: failure[0], description: failure[1] },
            ]
          : [200, { ok: true, result: this.result(method) }];
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      });
    });
    return new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
  }

  stop() {
    this.server?.closeAllConnections();
    return new Promise<void>((resolve) => this.server!.close(() => resolve()));
  }

  private result(method: string) {
    if (method === 'getMe') return { username: 'relay_test_bot' };
    if (method === 'getUpdates') return this.updates;
    return { message_id: this.nextId++ };
  }
}
