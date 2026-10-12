import { Injectable } from '@nestjs/common';
import {
  ProtocolError,
  SdkError,
  SdkHttpError,
} from '@modelcontextprotocol/client';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import {
  classifyMcpError,
  type McpFailure,
} from '../domain/classify-mcp-error.js';
import { catalogFromMcp } from '../domain/mcp-catalog.js';
import { readMcpResult } from '../domain/mcp-reply.js';
import type { ProviderEndpoint } from '../domain/provider-endpoint.js';
import type { ToolDescriptor } from '../domain/tool-catalog.js';
import type { ToolReply } from '../domain/tool-reply.js';
import { McpConnections } from './mcp-connections.js';

type McpEndpoint = Exclude<ProviderEndpoint, { kind: 'tools_api' }>;

/** MCP side of a provider: `tools/list` and `tools/call`. */
@Injectable()
export class McpToolClient {
  constructor(private readonly connections: McpConnections) {}

  catalog(endpoint: McpEndpoint): Promise<ToolDescriptor[]> {
    return this.connections.once(endpoint, async (client) =>
      catalogFromMcp((await client.listTools()).tools),
    );
  }

  /**
   * A tool that answers `isError` refused this input; a lost connection is
   * dropped so the retry opens a fresh one.
   */
  async call(
    providerId: string,
    endpoint: McpEndpoint,
    tool: string,
    input: unknown,
    { signal, timeoutMs }: { signal: AbortSignal; timeoutMs: number },
  ): Promise<ToolReply> {
    const result = await this.connections
      .with(providerId, endpoint, (client) =>
        client.callTool(
          { name: tool, arguments: (input ?? {}) as Record<string, unknown> },
          { signal, timeout: timeoutMs },
        ),
      )
      .catch(async (error: unknown) => {
        const failure = toMcpFailure(error);
        if (failure.kind !== 'protocol') {
          await this.connections.close(providerId);
        }
        throw new StepFailure(classifyMcpError(failure));
      });
    const read = readMcpResult(result);
    if (!read.ok) {
      throw new StepFailure({ kind: 'invalid', message: read.message });
    }
    return read.reply;
  }

  close(providerId: string) {
    return this.connections.close(providerId);
  }
}

function toMcpFailure(error: unknown): McpFailure {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof ProtocolError) {
    return { kind: 'protocol', code: error.code, message };
  }
  if (error instanceof SdkHttpError) {
    return { kind: 'http', status: error.status, message };
  }
  if (error instanceof SdkError) {
    return { kind: 'client', code: error.code, message };
  }
  return { kind: 'other', message };
}
