import type { NodeEvent, NodeEventResult } from './node-definition.js';

const DECISIONS = { approve: 'approved', reject: 'rejected' } as const;

/** `approve` / `reject` links become the matching port; anything else is ignored. */
export function approvalDecision(event: NodeEvent): NodeEventResult | null {
  const action = event.action;
  if (!action || !Object.hasOwn(DECISIONS, action)) return null;
  const decision = DECISIONS[action as keyof typeof DECISIONS];
  return {
    port: decision,
    output: {
      decision,
      comment: commentOf(event.payload),
      decidedAt: event.receivedAt.toISOString(),
    },
  };
}

function commentOf(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const comment = (payload as Record<string, unknown>).comment;
  return typeof comment === 'string' && comment.trim() ? comment.trim() : null;
}
