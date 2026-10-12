// A small MCP server over stdio, started by Relay as a command in the tests:
// `node fake-mcp-server.mjs`. Same tools as FakeMcpHttp.
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const PNG = Buffer.from('fake-png-bytes').toString('base64');

function createServer() {
  const server = new McpServer({ name: 'fake', version: '1.0.0' });
  server.registerTool(
    'echo',
    {
      description: 'Says the text back',
      inputSchema: z.object({ text: z.string() }),
    },
    async ({ text }) => ({
      content: [{ type: 'text', text: `echo: ${text}` }],
      structuredContent: { length: text.length },
    }),
  );
  server.registerTool(
    'refuse',
    { description: 'Always says no' },
    async () => ({
      content: [{ type: 'text', text: 'Not today' }],
      isError: true,
    }),
  );
  server.registerTool(
    'picture',
    { description: 'Draws a picture' },
    async () => ({
      content: [{ type: 'image', data: PNG, mimeType: 'image/png' }],
    }),
  );
  server.registerTool(
    'process_id',
    { description: 'Which process answered' },
    async () => ({ content: [{ type: 'text', text: String(process.pid) }] }),
  );
  return server;
}

serveStdio(() => createServer());
