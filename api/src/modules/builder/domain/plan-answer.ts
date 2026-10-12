import { z } from 'zod';
import { flowPlanSchema, type FlowPlan } from './flow-plan.js';

/**
 * The answer's JSON Schema for structured outputs. Every object there must
 * close its properties, so each step's free-form settings travel as a JSON
 * string (`configJson`) and are parsed here.
 */
export const PLAN_ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'summary', 'steps', 'links'],
  properties: {
    name: { type: 'string', description: 'Short name for the workflow' },
    summary: {
      type: 'string',
      description:
        'Two or three plain sentences: what it does and what the user still has to fill in',
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'type', 'configJson'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          configJson: {
            type: 'string',
            description:
              'The step settings as a JSON object, e.g. {"text":"Hi"}',
          },
        },
      },
    },
    links: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['from', 'to', 'port'],
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          port: { type: 'string' },
        },
      },
    },
  },
} as const;

const answerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  summary: z.string().trim(),
  steps: z.array(
    z.object({ id: z.string(), type: z.string(), configJson: z.string() }),
  ),
  links: z.array(
    z.object({ from: z.string(), to: z.string(), port: z.string() }),
  ),
});

export type PlanAnswer =
  | { ok: true; name: string; summary: string; plan: FlowPlan }
  | { ok: false; problems: string[] };

/** The model's JSON text as a plan, or what to tell it to fix. */
export function readPlanAnswer(text: string): PlanAnswer {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, problems: ['The answer was not valid JSON.'] };
  }
  const answer = answerSchema.safeParse(json);
  if (!answer.success) {
    return { ok: false, problems: [z.prettifyError(answer.error)] };
  }
  const { name, summary, steps, links } = answer.data;
  const problems: string[] = [];
  const parsedSteps = steps.map((step) => {
    const config = readConfig(step.configJson);
    if (!config) {
      problems.push(`Step "${step.id}": configJson is not a JSON object.`);
    }
    return { id: step.id, type: step.type, config: config ?? {} };
  });
  const plan = flowPlanSchema.safeParse({
    steps: parsedSteps,
    links: links.map((link) => ({ ...link, port: link.port || undefined })),
  });
  if (!plan.success) problems.push(z.prettifyError(plan.error));
  if (problems.length || !plan.success) return { ok: false, problems };
  return { ok: true, name, summary, plan: plan.data };
}

function readConfig(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text || '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
