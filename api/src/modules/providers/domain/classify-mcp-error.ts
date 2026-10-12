import type { StepError } from '../../engine/domain/step-error.js';

/** What the MCP client threw, reduced to what decides a retry. */
export type McpFailure =
  /** A JSON-RPC error answered by the server (code from the spec). */
  | { kind: 'protocol'; code: number; message: string }
  /** Raised by the client itself: timeouts, closed connections. */
  | { kind: 'client'; code: string; message: string }
  /** The HTTP request was answered with an error status. */
  | { kind: 'http'; status: number; message: string }
  /** The command could not start, or anything else. */
  | { kind: 'other'; message: string };

const INVALID_PARAMS = -32602;
const METHOD_NOT_FOUND = -32601;

/**
 * Wrong arguments or a tool the server no longer has will fail the same way
 * next time; a timeout or a dropped connection is worth another attempt.
 */
export function classifyMcpError(failure: McpFailure): StepError {
  const message = failure.message;
  switch (failure.kind) {
    case 'protocol':
      return failure.code === INVALID_PARAMS ||
        failure.code === METHOD_NOT_FOUND
        ? { kind: 'invalid', message }
        : { kind: 'unknown', message };
    case 'client':
      return failure.code === 'REQUEST_TIMEOUT'
        ? { kind: 'timeout', message }
        : { kind: 'network', message };
    case 'http':
      return { kind: 'http', status: failure.status, message };
    case 'other':
      return { kind: 'network', message };
  }
}
