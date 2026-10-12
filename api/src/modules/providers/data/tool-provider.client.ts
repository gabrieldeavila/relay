import { Injectable } from '@nestjs/common';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import {
  parseToolCatalog,
  type ToolDescriptor,
} from '../domain/tool-catalog.js';
import type { ToolReply } from '../domain/tool-reply.js';

/** Pincel's REST format: `GET /api/tools` and `POST /api/tools/<name>`. */
@Injectable()
export class ToolProviderClient {
  async catalog(baseUrl: string): Promise<ToolDescriptor[]> {
    const response = await fetch(`${baseUrl}/api/tools`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`${baseUrl}/api/tools answered ${response.status}`);
    }
    return parseToolCatalog(await response.json());
  }

  /** A 400 means the tool refused this input: retrying would not help. */
  async call(
    baseUrl: string,
    tool: string,
    input: unknown,
    { signal, idempotencyKey }: { signal: AbortSignal; idempotencyKey: string },
  ): Promise<ToolReply> {
    const response = await fetch(`${baseUrl}/api/tools/${tool}`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(input ?? {}),
    });
    const body = (await response.json().catch(() => null)) as
      (ToolReply & { error?: string }) | null;
    if (response.ok && body) return body;
    const message = body?.error ?? `${tool} answered ${response.status}`;
    throw new StepFailure(
      response.status === 400
        ? { kind: 'invalid', message }
        : { kind: 'http', status: response.status, message },
    );
  }
}
