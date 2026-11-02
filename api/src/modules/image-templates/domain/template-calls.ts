import type { ImageTemplate, TemplateStep } from './image-template.js';
import { fillPlaceholders } from './template-placeholders.js';

export interface ApplyTarget {
  /** The layer the person wants the template on. */
  layerId: string;
  /** The id the copy gets when keepOriginal (the next free layer id). */
  copyId: string;
  /** Work on a copy so the original layer stays untouched below it. */
  keepOriginal: boolean;
  width: number;
  height: number;
}

/** The batch calls that apply a template, with its placeholders filled in. */
export function templateCalls(
  template: ImageTemplate,
  target: ApplyTarget,
): TemplateStep[] {
  const copied = target.keepOriginal && editsLayer(template);
  const layer = copied ? target.copyId : target.layerId;
  const steps = fillPlaceholders(template.steps, {
    layer,
    width: target.width,
    height: target.height,
  });
  return copied ? [...copySteps(template.name, target), ...steps] : steps;
}

/** False for templates that only add layers on top (a vignette), which need no copy. */
export function editsLayer(template: ImageTemplate): boolean {
  const [first] = template.steps;
  const mentionsLayer = JSON.stringify(template.steps).includes('"$layer"');
  return mentionsLayer || first?.tool !== 'add_layer';
}

function copySteps(name: string, target: ApplyTarget): TemplateStep[] {
  return [
    { tool: 'duplicate_layer', input: { layerId: target.layerId } },
    {
      tool: 'update_layer',
      input: { layerId: target.copyId, name: `${name} look` },
    },
  ];
}
