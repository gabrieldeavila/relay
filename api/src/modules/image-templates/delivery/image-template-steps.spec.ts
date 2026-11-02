import { DocumentEngine } from '../../images/data/document-engine.js';
import { sampleColor } from '../../images/data/document-renderer.js';
import { napiPaintEnv } from '../../images/data/napi-paint-env.js';
import { runTool } from '../../images/delivery/tools/run-tool.js';
import { testServices } from '../../images/delivery/tools/test-services.js';
import { findTool } from '../../images/delivery/tools/tool-catalog.js';
import { BUILTIN_IMAGE_TEMPLATES } from '../domain/builtin-image-templates.js';
import { templateCalls } from '../domain/template-calls.js';
import { checkTemplateSteps } from './check-template-steps.js';

const noir = BUILTIN_IMAGE_TEMPLATES.find((t) => t.name === 'noir')!;

async function redImage() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 40, height: 40, background: '#ff0000' }, 'rest');
  return engine;
}

async function apply(engine: DocumentEngine, keepOriginal: boolean) {
  const calls = templateCalls(noir, {
    layerId: 'layer_1',
    copyId: 'layer_2',
    keepOriginal,
    width: 40,
    height: 40,
  });
  await runTool(
    findTool('batch')!,
    { calls, label: 'noir template' },
    { engine, ...testServices, source: 'mcp' },
  );
}

const isGray = (hex: string) =>
  hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7);

describe('image template steps', () => {
  it.each(BUILTIN_IMAGE_TEMPLATES.map((t) => [t.name, t]))(
    '%s passes the step check',
    (_, template) => {
      expect(() => checkTemplateSteps(template.steps)).not.toThrow();
    },
  );

  it('rejects unknown tools and bad input, listing every step', () => {
    expect(() =>
      checkTemplateSteps([
        { tool: 'export_image', input: {} },
        { tool: 'apply_filter', input: { filter: 'glitter' } },
      ]),
    ).toThrow(/Step 1 \(export_image\)[\s\S]*Step 2 \(apply_filter\)/);
  });

  it('applies a look to a copy in one undo step, keeping the original', async () => {
    const engine = await redImage();
    await apply(engine, true);
    expect(engine.log.map((e) => e.label)).toEqual(['noir template']);
    expect(sampleColor(engine.doc, 20, 20, 'layer_1')).toBe('#ff0000');
    expect(isGray(sampleColor(engine.doc, 20, 20, 'layer_2'))).toBe(true);
    expect(engine.doc.meta.layers.map((l) => l.name)).toContain('noir look');
  });

  it('edits the layer itself without keepOriginal', async () => {
    const engine = await redImage();
    await apply(engine, false);
    expect(isGray(sampleColor(engine.doc, 20, 20, 'layer_1'))).toBe(true);
  });
});
