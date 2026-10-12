import type { ProviderEndpoint, ProviderKind } from './provider-endpoint.js';
import { splitCommandLine } from './split-command-line.js';

/** What the Connections form sends: a URL, or a command typed on one line. */
export interface EndpointInput {
  kind: ProviderKind;
  baseUrl?: string;
  command?: string;
}

export type EndpointRead =
  { ok: true; endpoint: ProviderEndpoint } | { ok: false; message: string };

export function endpointFromInput(input: EndpointInput): EndpointRead {
  if (input.kind === 'mcp_stdio') {
    const parsed = splitCommandLine(input.command ?? '');
    return parsed
      ? { ok: true, endpoint: { kind: 'mcp_stdio', ...parsed } }
      : { ok: false, message: 'Type the command that starts the server' };
  }
  const url = readUrl(input.baseUrl);
  if (!url) return { ok: false, message: 'Type the address (http://…)' };
  return input.kind === 'mcp_http'
    ? { ok: true, endpoint: { kind: 'mcp_http', url } }
    : { ok: true, endpoint: { kind: 'tools_api', baseUrl: url } };
}

/** http(s) only, without the trailing slash. */
function readUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}
