import type { TemplateStep } from './image-template.js';

/** What a template's placeholders stand for in the image it is applied to. */
export interface PlaceholderValues {
  layer: string;
  width: number;
  height: number;
}

const TOKEN = /^\$(layer|width|height|cx|cy)(?:\*(-?\d+(?:\.\d+)?))?$/;

export const PLACEHOLDER_HELP =
  '"$layer" is the layer the template is applied to; "$width", "$height", "$cx", "$cy" are the canvas size and center, optionally scaled like "$width*0.5"';

/** The steps with every placeholder string replaced by its value. */
export function fillPlaceholders(
  steps: TemplateStep[],
  values: PlaceholderValues,
): TemplateStep[] {
  return steps.map((step) => ({
    tool: step.tool,
    input: fillValue(step.input, values) as Record<string, unknown>,
  }));
}

function fillValue(value: unknown, values: PlaceholderValues): unknown {
  if (typeof value === 'string') return fillToken(value, values);
  if (Array.isArray(value)) return value.map((v) => fillValue(v, values));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, fillValue(v, values)]),
    );
  }
  return value;
}

function fillToken(text: string, values: PlaceholderValues): unknown {
  const match = TOKEN.exec(text);
  if (!match) return text;
  const [, name, factor] = match;
  if (name === 'layer') return values.layer;
  return tokenNumber(name, values) * (factor ? Number(factor) : 1);
}

function tokenNumber(name: string, { width, height }: PlaceholderValues) {
  const numbers: Record<string, number> = {
    width,
    height,
    cx: width / 2,
    cy: height / 2,
  };
  return numbers[name];
}
