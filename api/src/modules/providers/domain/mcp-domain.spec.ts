import { isRetryable } from '../../engine/domain/step-error.js';
import { classifyMcpError } from './classify-mcp-error.js';
import { endpointFromInput } from './endpoint-from-input.js';
import { catalogFromMcp } from './mcp-catalog.js';
import { readMcpResult } from './mcp-reply.js';
import {
  describeEndpoint,
  endpointOf,
  toStoredEndpoint,
} from './provider-endpoint.js';
import { splitCommandLine } from './split-command-line.js';

describe('splitCommandLine', () => {
  it('splits words and keeps quoted parts together', () => {
    expect(
      splitCommandLine(`npx -y "@scope/server files" '~/My Docs' a\\ b`),
    ).toEqual({
      command: 'npx',
      args: ['-y', '@scope/server files', '~/My Docs', 'a\\', 'b'],
    });
  });

  it('keeps shell syntax as plain text', () => {
    expect(splitCommandLine('node server.js; rm -rf $HOME')).toEqual({
      command: 'node',
      args: ['server.js;', 'rm', '-rf', '$HOME'],
    });
  });

  it('allows empty quoted arguments and escaped quotes', () => {
    expect(splitCommandLine(`run "" "say \\"hi\\""`)).toEqual({
      command: 'run',
      args: ['', 'say "hi"'],
    });
  });

  it('refuses nothing to run and unclosed quotes', () => {
    expect(splitCommandLine('   ')).toBeNull();
    expect(splitCommandLine('npx "oops')).toBeNull();
  });
});

describe('endpointFromInput', () => {
  it('reads a URL for apps and MCP servers over HTTP', () => {
    expect(
      endpointFromInput({
        kind: 'tools_api',
        baseUrl: ' http://localhost:4300/ ',
      }),
    ).toEqual({
      ok: true,
      endpoint: { kind: 'tools_api', baseUrl: 'http://localhost:4300' },
    });
    expect(
      endpointFromInput({
        kind: 'mcp_http',
        baseUrl: 'http://127.0.0.1:9000/mcp',
      }),
    ).toEqual({
      ok: true,
      endpoint: { kind: 'mcp_http', url: 'http://127.0.0.1:9000/mcp' },
    });
  });

  it('reads a command for local MCP servers', () => {
    expect(
      endpointFromInput({ kind: 'mcp_stdio', command: 'npx -y server-x' }),
    ).toEqual({
      ok: true,
      endpoint: { kind: 'mcp_stdio', command: 'npx', args: ['-y', 'server-x'] },
    });
  });

  it('explains a missing or unusable address', () => {
    expect(endpointFromInput({ kind: 'mcp_http' })).toMatchObject({
      ok: false,
    });
    expect(
      endpointFromInput({ kind: 'tools_api', baseUrl: 'file:///etc/passwd' }),
    ).toMatchObject({ ok: false });
    expect(endpointFromInput({ kind: 'mcp_stdio', command: '' })).toMatchObject(
      {
        ok: false,
      },
    );
  });
});

describe('provider endpoints', () => {
  it('round-trips through the stored columns', () => {
    const endpoints = [
      { kind: 'tools_api' as const, baseUrl: 'http://a' },
      { kind: 'mcp_http' as const, url: 'http://b/mcp' },
      { kind: 'mcp_stdio' as const, command: 'npx', args: ['-y', 'x'] },
    ];
    for (const endpoint of endpoints) {
      expect(endpointOf(toStoredEndpoint(endpoint))).toEqual(endpoint);
    }
  });

  it('shows a command the way it was typed', () => {
    expect(
      describeEndpoint({
        kind: 'mcp_stdio',
        command: 'node',
        args: ['server.js', 'My Folder', ''],
      }),
    ).toBe('node server.js "My Folder" ""');
  });
});

describe('catalogFromMcp', () => {
  it('turns MCP tools into the shared catalog format', () => {
    expect(
      catalogFromMcp([
        { name: 'files.read', title: 'Read', inputSchema: { type: 'object' } },
        { name: 'echo', description: 'Echo', inputSchema: { type: 'object' } },
      ]),
    ).toEqual([
      {
        name: 'files.read',
        description: 'Read',
        input_schema: { type: 'object' },
      },
      { name: 'echo', description: 'Echo', input_schema: { type: 'object' } },
    ]);
  });
});

describe('readMcpResult', () => {
  it('joins text, keeps structured content and the first image', () => {
    expect(
      readMcpResult({
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image', data: 'AAA', mimeType: 'image/jpeg' },
          { type: 'text', text: 'world' },
        ],
        structuredContent: { n: 1 },
      }),
    ).toEqual({
      ok: true,
      reply: {
        text: 'Hello\nworld',
        data: { n: 1 },
        image: 'AAA',
        imageMimeType: 'image/jpeg',
      },
    });
  });

  it('reports a tool error with its text', () => {
    expect(
      readMcpResult({
        isError: true,
        content: [{ type: 'text', text: 'No such file' }],
      }),
    ).toEqual({ ok: false, message: 'No such file' });
    expect(readMcpResult({ isError: true })).toMatchObject({ ok: false });
  });
});

describe('classifyMcpError', () => {
  it('does not retry wrong arguments or a missing tool', () => {
    for (const code of [-32602, -32601]) {
      expect(
        isRetryable(classifyMcpError({ kind: 'protocol', code, message: 'x' })),
      ).toBe(false);
    }
  });

  it('retries timeouts, dropped connections and server errors', () => {
    const failures = [
      { kind: 'client' as const, code: 'REQUEST_TIMEOUT', message: 'slow' },
      { kind: 'client' as const, code: 'CONNECTION_CLOSED', message: 'gone' },
      { kind: 'http' as const, status: 503, message: 'busy' },
      { kind: 'other' as const, message: 'spawn npx ENOENT' },
    ];
    for (const failure of failures) {
      expect(isRetryable(classifyMcpError(failure))).toBe(true);
    }
  });

  it('does not retry a refused sign-in', () => {
    expect(
      isRetryable(
        classifyMcpError({ kind: 'http', status: 401, message: 'no' }),
      ),
    ).toBe(false);
  });
});
