import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { z } from 'zod';

/** An MCP server over Streamable HTTP at `/mcp`, with an `echo` tool. */
export class FakeMcpHttp {
  readonly calls: string[] = [];
  private server?: Server;
  private readonly mcp = createMcpHandler(() => this.create());

  get url() {
    const { port } = this.server!.address() as AddressInfo;
    return `http://127.0.0.1:${port}/mcp`;
  }

  start() {
    const handle = toNodeHandler(this.mcp);
    this.server = createServer((req, res) => void handle(req, res));
    return new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
  }

  async stop() {
    await this.mcp.close();
    this.server?.closeAllConnections();
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
  }

  private create() {
    const server = new McpServer({ name: 'fake-http', version: '1.0.0' });
    server.registerTool(
      'echo',
      {
        description: 'Says the text back',
        inputSchema: z.object({ text: z.string() }),
      },
      ({ text }) => {
        this.calls.push(text);
        return Promise.resolve({
          content: [{ type: 'text' as const, text: `echo: ${text}` }],
        });
      },
    );
    return server;
  }
}
