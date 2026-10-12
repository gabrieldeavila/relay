import { z } from 'zod';

/** Readable ids people see in `{{ steps.<id>.output }}`; also safe in file names. */
export const STEP_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * A flow as an AI (or an MCP client) writes it: steps and the links between
 * them, without canvas positions or edge ids, which Relay fills in.
 */
export const flowPlanSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z
          .string()
          .regex(STEP_ID, 'Step ids are letters, digits, _ and - (max 64)'),
        type: z.string().min(1),
        config: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(60),
  links: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
        /** Exit of `from`; `out` when left out. */
        port: z.string().min(1).optional(),
      }),
    )
    .default([]),
});

export type FlowPlan = z.infer<typeof flowPlanSchema>;
