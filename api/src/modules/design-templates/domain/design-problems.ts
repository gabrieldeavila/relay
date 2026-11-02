import type { DesignTemplate } from './design-template.js';

const FIELD = /\{\{(\w+)\}\}/g;

/** Mistakes in a design's own wiring: fields used but not declared, conditions on unknown fields. */
export function designProblems(template: DesignTemplate): string[] {
  const declared = new Set(Object.keys(template.fields));
  const problems: string[] = [];
  template.steps.forEach((step, i) => {
    const used = [...JSON.stringify(step.input).matchAll(FIELD)].map(
      (match) => match[1],
    );
    const conditions = [step.when, step.unless].filter(Boolean) as string[];
    for (const key of new Set([...used, ...conditions])) {
      if (!declared.has(key)) {
        problems.push(`Step ${i + 1} (${step.tool}): no field "${key}"`);
      }
    }
  });
  for (const [key, field] of Object.entries(template.fields)) {
    if (field.kind !== 'image' && !field.default) {
      problems.push(`Field "${key}" needs a default`);
    }
  }
  return problems;
}

/** Stand-in values that make every step's input checkable, both branches of when/unless included. */
export function sampleValues(template: DesignTemplate) {
  const sample: Record<string, string> = {};
  for (const [key, field] of Object.entries(template.fields)) {
    sample[key] =
      field.kind === 'image'
        ? '00000000-0000-4000-8000-000000000000'
        : (field.default ?? 'Sample');
  }
  return sample;
}
