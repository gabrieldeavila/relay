import { Injectable } from '@nestjs/common';
import type { ProviderEndpoint } from '../domain/provider-endpoint.js';
import type { ToolDescriptor } from '../domain/tool-catalog.js';
import type { ToolReply } from '../domain/tool-reply.js';
import { McpToolClient } from './mcp-tool.client.js';
import { ToolProviderClient } from './tool-provider.client.js';

export interface ToolCallContext {
  signal: AbortSignal;
  idempotencyKey: string;
  timeoutMs: number;
}

/** Reads catalogs and calls tools the way each kind of app expects. */
@Injectable()
export class ToolCaller {
  constructor(
    private readonly rest: ToolProviderClient,
    private readonly mcp: McpToolClient,
  ) {}

  catalog(endpoint: ProviderEndpoint): Promise<ToolDescriptor[]> {
    return endpoint.kind === 'tools_api'
      ? this.rest.catalog(endpoint.baseUrl)
      : this.mcp.catalog(endpoint);
  }

  call(
    providerId: string,
    endpoint: ProviderEndpoint,
    tool: string,
    input: unknown,
    ctx: ToolCallContext,
  ): Promise<ToolReply> {
    return endpoint.kind === 'tools_api'
      ? this.rest.call(endpoint.baseUrl, tool, input, ctx)
      : this.mcp.call(providerId, endpoint, tool, input, ctx);
  }

  /** Lets go of a provider's open connection (removed or refreshed). */
  release(providerId: string): Promise<void> {
    return this.mcp.close(providerId);
  }
}
