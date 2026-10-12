import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { Client } from '@modelcontextprotocol/client';
import {
  describeEndpoint,
  type ProviderEndpoint,
} from '../domain/provider-endpoint.js';
import { openMcpClient } from './open-mcp-client.js';

type McpEndpoint = Exclude<ProviderEndpoint, { kind: 'tools_api' }>;

/**
 * One open connection per connected MCP server, opened on first use and
 * reused by later steps (a command-started server stays running). A dropped
 * connection is opened again on the next call.
 */
@Injectable()
export class McpConnections implements OnModuleDestroy {
  private readonly open = new Map<string, Promise<Client>>();

  /** Calls `use` on the server's connection; `key` separates connections. */
  async with<T>(
    key: string,
    endpoint: McpEndpoint,
    use: (client: Client) => Promise<T>,
  ): Promise<T> {
    const id = `${key}|${describeEndpoint(endpoint)}`;
    let pending = this.open.get(id);
    if (!pending) {
      pending = openMcpClient(endpoint, () => this.forget(id, pending!)).then(
        (opened) => opened.client,
      );
      this.open.set(id, pending);
      pending.catch(() => this.forget(id, pending!));
    }
    return use(await pending);
  }

  /** Reads something once over a short-lived connection (e.g. the catalog). */
  async once<T>(
    endpoint: McpEndpoint,
    use: (client: Client) => Promise<T>,
  ): Promise<T> {
    const { client } = await openMcpClient(endpoint, () => undefined);
    try {
      return await use(client);
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  /** Closes a provider's connections (removed, or its address changed). */
  async close(key: string): Promise<void> {
    const closing = [...this.open.keys()]
      .filter((id) => id.startsWith(`${key}|`))
      .map((id) => this.drop(id));
    await Promise.all(closing);
  }

  async onModuleDestroy() {
    await Promise.all([...this.open.keys()].map((id) => this.drop(id)));
  }

  private forget(id: string, pending: Promise<Client>) {
    if (this.open.get(id) === pending) this.open.delete(id);
  }

  private async drop(id: string) {
    const pending = this.open.get(id);
    this.open.delete(id);
    const client = await pending?.catch(() => null);
    await client?.close().catch(() => undefined);
  }
}
