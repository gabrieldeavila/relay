import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const graphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      config: z.record(z.string(), z.unknown()).default({}),
      position: z.object({ x: z.number(), y: z.number() }),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      sourcePort: z.string().min(1).default('out'),
      target: z.string().min(1),
    }),
  ),
});

export const createWorkflowBody = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateWorkflowBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  draftGraph: graphSchema.optional(),
});

/** Zod parse that answers 400 with a readable message. */
export function parseBody<T extends z.ZodType>(schema: T, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(z.prettifyError(result.error));
  }
  return result.data;
}
