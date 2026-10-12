export const PROVIDER_KINDS = ['tools_api', 'mcp_http', 'mcp_stdio'] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];

/**
 * How Relay reaches an app's tools: Pincel's REST catalog (`GET /api/tools`),
 * an MCP server over HTTP, or an MCP server started as a local command.
 */
export type ProviderEndpoint =
  | { kind: 'tools_api'; baseUrl: string }
  | { kind: 'mcp_http'; url: string }
  | { kind: 'mcp_stdio'; command: string; args: string[] };

/** Columns as stored: a URL for the HTTP kinds, a command for stdio. */
export interface StoredEndpoint {
  kind: ProviderKind;
  baseUrl: string | null;
  command: { command: string; args: string[] } | null;
}

export function endpointOf(stored: StoredEndpoint): ProviderEndpoint {
  switch (stored.kind) {
    case 'tools_api':
      return { kind: 'tools_api', baseUrl: required(stored.baseUrl) };
    case 'mcp_http':
      return { kind: 'mcp_http', url: required(stored.baseUrl) };
    case 'mcp_stdio': {
      const { command, args } = required(stored.command);
      return { kind: 'mcp_stdio', command, args };
    }
  }
}

export function toStoredEndpoint(endpoint: ProviderEndpoint): StoredEndpoint {
  switch (endpoint.kind) {
    case 'tools_api':
      return { kind: endpoint.kind, baseUrl: endpoint.baseUrl, command: null };
    case 'mcp_http':
      return { kind: endpoint.kind, baseUrl: endpoint.url, command: null };
    case 'mcp_stdio':
      return {
        kind: endpoint.kind,
        baseUrl: null,
        command: { command: endpoint.command, args: endpoint.args },
      };
  }
}

/** One line for the Connections page: the address or the command. */
export function describeEndpoint(endpoint: ProviderEndpoint): string {
  switch (endpoint.kind) {
    case 'tools_api':
      return endpoint.baseUrl;
    case 'mcp_http':
      return endpoint.url;
    case 'mcp_stdio':
      return [endpoint.command, ...endpoint.args].map(quoteIfNeeded).join(' ');
  }
}

const quoteIfNeeded = (part: string) =>
  /[\s"']/.test(part) || part === '' ? JSON.stringify(part) : part;

function required<T>(value: T | null): T {
  if (value === null) throw new Error('Connection is missing its address');
  return value;
}
