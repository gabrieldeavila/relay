import { NOT_BATCHABLE } from '../../images/delivery/tools/batch-tool.js';
import {
  describeError,
  parseToolInput,
} from '../../images/delivery/tools/run-tool.js';
import { findTool } from '../../images/delivery/tools/tool-catalog.js';
import type { TemplateStep } from '../domain/image-template.js';
import { fillPlaceholders } from '../domain/template-placeholders.js';

/** Stand-in values, so steps with placeholders can be checked before any image exists. */
const SAMPLE = { layer: 'layer_1', width: 1000, height: 1000 };

/** Throws with every bad step at once, so a broken template is never saved. */
export function checkTemplateSteps(steps: TemplateStep[]): void {
  const problems = fillPlaceholders(steps, SAMPLE).flatMap((step, i) => {
    const problem = stepProblem(step);
    return problem ? [`Step ${i + 1} (${step.tool}): ${problem}`] : [];
  });
  if (problems.length > 0) {
    throw new Error(`Invalid template steps.\n${problems.join('\n')}`);
  }
}

function stepProblem(step: TemplateStep): string | null {
  const tool = findTool(step.tool);
  if (!tool || NOT_BATCHABLE.has(step.tool)) {
    return 'not an image tool that can run in a template';
  }
  try {
    parseToolInput(tool, step.input);
    return null;
  } catch (error) {
    return describeError(error);
  }
}
