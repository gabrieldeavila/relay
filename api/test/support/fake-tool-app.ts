import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

type Handler = (
  input: Record<string, unknown>,
) => Promise<{ status?: number; body: unknown }>;

/** A tiny app in Pincel's tool format: GET /api/tools, POST /api/tools/:name. */
export class FakeToolApp {
  readonly calls: { tool: string; input: Record<string, unknown> }[] = [];
  /** Highest number of calls running at the same time. */
  maxConcurrent = 0;
  private running = 0;
  private server?: Server;

  constructor(
    private readonly tools: {
      name: string;
      input_schema: Record<string, unknown>;
    }[],
    private readonly handlers: Record<string, Handler>,
  ) {}

  get url() {
    return `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
  }

  start() {
    this.server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk: Buffer) => (raw += chunk.toString()));
      req.on(
        'end',
        () => void this.answer(req.method, req.url ?? '', raw, res),
      );
    });
    return new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
  }

  stop() {
    this.server?.closeAllConnections();
    return new Promise<void>((resolve) => this.server!.close(() => resolve()));
  }

  private async answer(
    method = '',
    url: string,
    raw: string,
    res: import('node:http').ServerResponse,
  ) {
    const reply = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (method === 'GET' && url === '/api/tools') {
      return reply(
        200,
        this.tools.map((tool) => ({ description: '', ...tool })),
      );
    }
    const tool = url.match(/^\/api\/tools\/(\w+)$/)?.[1];
    const handler = tool && this.handlers[tool];
    if (method !== 'POST' || !handler)
      return reply(404, { error: 'Unknown tool' });

    const input = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
    this.calls.push({ tool, input });
    this.running++;
    this.maxConcurrent = Math.max(this.maxConcurrent, this.running);
    try {
      const { status = 200, body } = await handler(input);
      reply(status, body);
    } finally {
      this.running--;
    }
  }
}
