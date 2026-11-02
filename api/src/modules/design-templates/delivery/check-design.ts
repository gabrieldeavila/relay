import { checkTemplateSteps } from '../../image-templates/delivery/check-template-steps.js';
import type { DesignTemplate } from '../domain/design-template.js';
import { designProblems, sampleValues } from '../domain/design-problems.js';
import { designSteps } from '../domain/fill-design.js';

/** Throws if the design can't be drawn, so a broken template is never saved. */
export function checkDesign(template: DesignTemplate): void {
  const problems = designProblems(template);
  if (problems.length > 0) {
    throw new Error(`Invalid design template.\n${problems.join('\n')}`);
  }
  const allSteps = { ...template, steps: template.steps.map(withoutCondition) };
  checkTemplateSteps(designSteps(allSteps, sampleValues(template)));
}

function withoutCondition({ tool, input }: DesignTemplate['steps'][number]) {
  return { tool, input };
}
