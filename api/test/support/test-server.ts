import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface Received {
  method: string;
  path: string;
  body: unknown;
  headers: IncomingMessage['headers'];
}

/** What the server answers; `hang` never answers (for timeouts). */
export type Reply = { status: number; body?: unknown } | 'hang';

/** A local HTTP endpoint whose answers each test scripts. */
export class TestServer {
  readonly received: Received[] = [];
  private replies: Reply[] = [];
  private server?: Server;

  /** Answers in order; the last one repeats. */
  reply(...replies: Reply[]) {
    this.replies = replies;
    this.received.length = 0;
  }

  url(path = '/') {
    const { port } = this.server!.address() as AddressInfo;
    return `http://127.0.0.1:${port}${path}`;
  }

  start() {
    this.server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk: Buffer) => (raw += chunk.toString()));
      req.on('end', () => {
        this.received.push({
          method: req.method ?? '',
          path: req.url ?? '',
          body: raw ? JSON.parse(raw) : undefined,
          headers: req.headers,
        });
        const reply =
          this.replies.length > 1 ? this.replies.shift()! : this.replies[0];
        if (!reply || reply === 'hang') return;
        res.writeHead(reply.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(reply.body ?? {}));
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
}
