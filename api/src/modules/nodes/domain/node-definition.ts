import type { z } from 'zod';
import type { RetryPolicy } from '../../engine/domain/retry-policy.js';
import type { NodeKind } from '../../workflows/domain/node-spec.js';
import type { NodeContext } from './node-context.js';
import type { NodeResult } from './node-result.js';

export interface NodeDefinition<Config extends z.ZodObject = z.ZodObject> {
  type: string;
  kind: NodeKind;
  title: string;
  description: string;
  /** Validated after expressions are resolved; also drives the editor form. */
  config: Config;
  outputPorts: readonly string[];
  retry?: Partial<RetryPolicy>;
  /** Per-attempt limit; the attempt is aborted and retried after it. */
  timeoutMs?: number;
  run(config: z.infer<Config>, ctx: NodeContext): Promise<NodeResult>;
  /**
   * For nodes that `wait`: turns an event sent to the step into its result.
   * Null rejects the event (e.g. an unknown action) and the step keeps waiting.
   */
  onEvent?(event: NodeEvent): NodeEventResult | null;
}

export interface NodeEvent {
  /** From the link that was called, e.g. `approve`; null for plain webhooks. */
  action: string | null;
  payload: unknown;
  receivedAt: Date;
}

export interface NodeEventResult {
  output: unknown;
  port?: string;
}

export function defineNode<Config extends z.ZodObject>(
  node: NodeDefinition<Config>,
): NodeDefinition {
  return node;
}
