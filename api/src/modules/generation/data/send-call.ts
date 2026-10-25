import { errorReason } from '../domain/error-reason.js';
import type { ProviderCall } from '../domain/provider-spec.js';

const TIMEOUT_MS = 180_000;

/** Makes a provider call and returns its JSON answer; failures become clear errors. */
export async function sendCall(call: ProviderCall): Promise<unknown> {
  const response = await fetch(call.url, {
    method: call.method,
    headers: {
      ...call.headers,
      ...(call.body === undefined
        ? {}
        : { 'content-type': 'application/json' }),
    },
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: Error) => {
    throw new Error(`Could not reach the image AI: ${error.message}`);
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `The image AI refused: ${errorReason(body, response.status)}`,
    );
  }
  return body;
}

/** Downloads a generated image the provider links to. */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `Could not download the generated image: HTTP ${response.status}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}
