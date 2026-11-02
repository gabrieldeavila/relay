import type { TemplateStep } from '../../image-templates/domain/image-template.js';
import type {
  DesignStep,
  DesignTemplate,
  FieldValues,
} from './design-template.js';

const FIELD = /\{\{(\w+)\}\}/g;

/** The given values plus defaults; throws on a field the template doesn't have. */
export function fieldValues(
  template: DesignTemplate,
  given: FieldValues,
): FieldValues {
  const unknown = Object.keys(given).filter((key) => !template.fields[key]);
  if (unknown.length > 0) {
    const known = Object.keys(template.fields).join(', ');
    throw new Error(
      `"${template.name}" has no field ${unknown.join(', ')}. Its fields: ${known}.`,
    );
  }
  const values: FieldValues = {};
  for (const [key, field] of Object.entries(template.fields)) {
    const value = given[key] || field.default;
    if (value !== undefined && value !== '') values[key] = value;
  }
  return values;
}

/** The steps to run: conditions decided and every "{{field}}" filled in. */
export function designSteps(
  template: DesignTemplate,
  values: FieldValues,
): TemplateStep[] {
  return template.steps
    .filter((step) => keepStep(step, values))
    .map(({ tool, input }) => ({
      tool,
      input: fillFields(input, values) as Record<string, unknown>,
    }));
}

function keepStep(step: DesignStep, values: FieldValues): boolean {
  if (step.when && !(step.when in values)) return false;
  if (step.unless && step.unless in values) return false;
  return true;
}

function fillFields(value: unknown, values: FieldValues): unknown {
  if (typeof value === 'string') {
    return value.replace(FIELD, (token, key: string) => values[key] ?? token);
  }
  if (Array.isArray(value)) return value.map((v) => fillFields(v, values));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, fillFields(v, values)]),
    );
  }
  return value;
}
