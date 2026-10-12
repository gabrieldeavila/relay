import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import type { Readable } from 'node:stream';
import type { ProviderEndpoint } from '../domain/provider-endpoint.js';

const CONNECT_TIMEOUT_MS = 30_000;
/** Enough of a server's error output to say why it would not start. */
const STDERR_TAIL = 2_000;

export interface OpenMcpClient {
  client: Client;
  /** The last lines the command printed to stderr (empty over HTTP). */
  stderr: () => string;
}

/** Connects to an MCP server; a command is started directly, never through a shell. */
export async function openMcpClient(
  endpoint: Exclude<ProviderEndpoint, { kind: 'tools_api' }>,
  onClose: () => void,
): Promise<OpenMcpClient> {
  const client = new Client({ name: 'relay', version: '0.1.0' });
  let stderrTail = '';
  const transport =
    endpoint.kind === 'mcp_http'
      ? new StreamableHTTPClientTransport(new URL(endpoint.url))
      : new StdioClientTransport({
          command: endpoint.command,
          args: endpoint.args,
          stderr: 'pipe',
        });
  if (transport instanceof StdioClientTransport) {
    (transport.stderr as Readable | null)?.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-STDERR_TAIL);
    });
  }
  client.onclose = onClose;
  const stderr = () => stderrTail.trim();
  try {
    await client.connect(transport, { timeout: CONNECT_TIMEOUT_MS });
  } catch (error) {
    await client.close().catch(() => undefined);
    const output = stderr();
    if (output && error instanceof Error) {
      error.message = `${error.message}\n${output}`;
    }
    throw error;
  }
  return { client, stderr };
}
