import { z } from 'zod';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';
import { StepFailure } from '../domain/step-failure.js';

export const httpRequestNode = defineNode({
  type: 'http.request',
  kind: 'action',
  title: 'Call a web address',
  description: 'Sends an HTTP request and returns the response.',
  config: z.object({
    url: z.url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
    headers: z.record(z.string(), z.string()).default({}),
    body: z.unknown().optional(),
  }),
  outputPorts: ['out', 'error'],
  timeoutMs: 30_000,
  async run({ url, method, headers, body }, ctx) {
    const response = await fetch(url, {
      method,
      signal: ctx.signal,
      headers: {
        'idempotency-key': ctx.idempotencyKey,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new StepFailure({
        kind: 'http',
        status: response.status,
        message: `${response.status} ${response.statusText}`.trim(),
      });
    }
    return done({ status: response.status, body: await readBody(response) });
  },
});

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  return type.includes('json') ? response.json() : response.text();
}
