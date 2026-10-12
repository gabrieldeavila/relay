export type ReplyRead =
  | { ok: true; text: string; truncated: boolean }
  | { ok: false; reason: 'refusal'; explanation: string | null };

interface ReplyShape {
  stop_reason: string | null;
  stop_details?: { explanation?: string | null } | null;
  content: { type: string; text?: string }[];
}

/**
 * The text of a reply. A refusal is an outcome, not a crash: the step fails
 * with the reason instead of passing empty text along.
 */
export function readReply(reply: ReplyShape): ReplyRead {
  if (reply.stop_reason === 'refusal') {
    return {
      ok: false,
      reason: 'refusal',
      explanation: reply.stop_details?.explanation ?? null,
    };
  }
  const text = reply.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
  return { ok: true, text, truncated: reply.stop_reason === 'max_tokens' };
}
