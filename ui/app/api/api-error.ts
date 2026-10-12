/** A non-2xx answer from the Relay API, with its parsed body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(messageOf(body) ?? `Request failed (${status})`);
  }
}

function messageOf(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const message = (body as { message?: unknown }).message;
  if (typeof message === "string") return message;
  return Array.isArray(message) ? message.join(", ") : null;
}
