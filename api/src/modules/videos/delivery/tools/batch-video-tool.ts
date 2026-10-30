import { z } from 'zod';
import { applyVideoCommand } from '../../domain/apply-video-command.js';
import type { VideoCommand } from '../../domain/video-command-types.js';
import {
  defineVideoEdit,
  type EditPlanResult,
  type VideoEditTool,
} from './video-edit-tool.js';

const MAX_STEPS = 100;

/** Several timeline edits as one: all-or-nothing and a single undo step. */
export function createBatchVideoTool(tools: VideoEditTool[]): VideoEditTool {
  const names = tools.map((tool) => tool.name) as [string, ...string[]];
  return defineVideoEdit({
    name: 'batch_video',
    title: 'Batch video edits',
    description: [
      `Runs many video edits (${names.join(', ')}) in order as ONE edit: all-or-nothing and one undo step.`,
      'Each step sees the result of the previous ones, so new clip ids are predictable: clip_<highest + 1>.',
      'Example: {"calls":[{"tool":"add_clip","input":{"assetId":"…"}},{"tool":"add_text","input":{"text":"Day 1","start":0,"duration":2}}]}',
    ].join(' '),
    input: {
      calls: z
        .array(
          z.object({
            tool: z.enum(names),
            input: z.record(z.string(), z.unknown()).default({}),
          }),
        )
        .min(1)
        .max(MAX_STEPS),
    },
    async plan({ calls }, timeline, deps) {
      let current = timeline;
      const commands: VideoCommand[] = [];
      const lines: string[] = [];
      const afters: NonNullable<EditPlanResult['after']>[] = [];
      for (const [i, call] of calls.entries()) {
        const tool = tools.find((t) => t.name === call.tool)!;
        try {
          const input = z.object(tool.input).parse(call.input);
          const step = await tool.plan(input, current, deps);
          current = step.commands.reduce(applyVideoCommand, current);
          commands.push(...step.commands);
          if (step.after) afters.push(step.after);
          lines.push(`${i + 1}. ${tool.name}: ${step.text}`);
        } catch (error) {
          const message =
            error instanceof z.ZodError
              ? z.prettifyError(error)
              : (error as Error).message;
          throw new Error(
            `Step ${i + 1} (${call.tool}) failed: ${message}. Nothing was applied.`,
          );
        }
      }
      return {
        commands,
        text: lines.join('\n'),
        after: afters.length ? () => runInOrder(afters) : undefined,
      };
    },
  });
}

async function runInOrder(
  afters: NonNullable<EditPlanResult['after']>[],
): Promise<string | null> {
  const notes: string[] = [];
  for (const after of afters) {
    const note = await after();
    if (note) notes.push(note);
  }
  return notes.join('\n') || null;
}
