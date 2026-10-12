import { API_URL, authHeaders } from "@/app/api/api-request";
import { parseSse } from "../domain/sse-parser";
import type { RunDetail } from "../domain/types";

/**
 * Reads `GET /runs/:id/events` (server-sent events) with fetch, because
 * EventSource cannot send the login token. Resolves when the stream ends.
 */
export async function streamRun(
  runId: string,
  onRun: (run: RunDetail) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_URL}/runs/${runId}/events`, {
    headers: await authHeaders(),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Stream failed (${response.status})`);
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    const { events, rest } = parseSse(buffer + value);
    buffer = rest;
    for (const event of events) {
      if (event.event === "run") onRun(JSON.parse(event.data) as RunDetail);
    }
  }
}
