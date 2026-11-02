import { templateKey } from '../../text-templates/domain/template-name.js';
import { BUILTIN_IMAGE_TEMPLATES } from './builtin-image-templates.js';
import type { ImageTemplate } from './image-template.js';
import { editsLayer, templateCalls } from './template-calls.js';
import { fillPlaceholders } from './template-placeholders.js';

const values = { layer: 'layer_3', width: 800, height: 600 };

const target = {
  layerId: 'layer_1',
  copyId: 'layer_4',
  keepOriginal: true,
  width: 800,
  height: 600,
};

const blur: ImageTemplate = {
  name: 'soft',
  description: 'blur',
  steps: [
    { tool: 'apply_filter', input: { layerId: '$layer', filter: 'blur' } },
  ],
};

const overlay: ImageTemplate = {
  name: 'frame',
  description: 'adds a layer',
  steps: [
    { tool: 'add_layer', input: { name: 'Frame' } },
    { tool: 'fill_layer', input: { color: 'red' } },
  ],
};

describe('fillPlaceholders', () => {
  it('fills layer, size and center tokens, deep in the input', () => {
    const [step] = fillPlaceholders(
      [
        {
          tool: 'draw_gradient',
          input: {
            layerId: '$layer',
            from: ['$cx', '$cy'],
            to: ['$width', '$height*0.5'],
            rect: { x: 0, y: 0, width: '$width*-1', height: 10 },
          },
        },
      ],
      values,
    );
    expect(step.input).toEqual({
      layerId: 'layer_3',
      from: [400, 300],
      to: [800, 300],
      rect: { x: 0, y: 0, width: -800, height: 10 },
    });
  });

  it('leaves other strings alone', () => {
    const [step] = fillPlaceholders(
      [{ tool: 'draw_text', input: { text: 'costs $width', color: '$red' } }],
      values,
    );
    expect(step.input).toEqual({ text: 'costs $width', color: '$red' });
  });
});

describe('templateCalls', () => {
  it('works on a renamed copy when keeping the original', () => {
    expect(templateCalls(blur, target)).toEqual([
      { tool: 'duplicate_layer', input: { layerId: 'layer_1' } },
      {
        tool: 'update_layer',
        input: { layerId: 'layer_4', name: 'soft look' },
      },
      { tool: 'apply_filter', input: { layerId: 'layer_4', filter: 'blur' } },
    ]);
  });

  it('edits the layer itself without keepOriginal', () => {
    const calls = templateCalls(blur, { ...target, keepOriginal: false });
    expect(calls).toEqual([
      { tool: 'apply_filter', input: { layerId: 'layer_1', filter: 'blur' } },
    ]);
  });

  it('skips the copy for templates that only add layers on top', () => {
    expect(editsLayer(overlay)).toBe(false);
    expect(templateCalls(overlay, target)).toEqual(overlay.steps);
  });

  it('copies when the first step would edit the active layer', () => {
    const tintFirst = { ...overlay, steps: overlay.steps.slice(1) };
    expect(editsLayer(tintFirst)).toBe(true);
  });
});

describe('built-in image templates', () => {
  it('have unique, stored-form names', () => {
    const names = BUILTIN_IMAGE_TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(templateKey(name)).toBe(name);
  });
});
