import { DocumentEngine } from '../../images/data/document-engine.js';
import { sampleColor } from '../../images/data/document-renderer.js';
import {
  testPaintEnv,
  testServices,
} from '../../images/delivery/tools/test-services.js';
import { designSetup, drawDesign } from '../data/draw-design.js';
import { BUILTIN_DESIGN_TEMPLATES } from '../domain/builtin-design-templates.js';
import { checkDesign } from './check-design.js';

const bold = BUILTIN_DESIGN_TEMPLATES.find(
  (t) => t.name === 'bold-announcement',
)!;

describe('design templates', () => {
  it.each(BUILTIN_DESIGN_TEMPLATES.map((t) => [t.name, t]))(
    '%s passes the design check',
    (_, template) => {
      expect(() => checkDesign(template)).not.toThrow();
    },
  );

  it('rejects steps with bad tool input', () => {
    const broken = {
      ...bold,
      steps: [{ tool: 'draw_rect', input: { fill: '{{background}}' } }],
    };
    expect(() => checkDesign(broken)).toThrow(/Step 1 \(draw_rect\)/);
  });

  it('draws a design with the given colors as one undo step', async () => {
    const engine = new DocumentEngine(testPaintEnv);
    await engine.reset(designSetup(bold), 'rest');
    // Fonts download from Google Fonts; offline they fall back, which is fine here.
    await drawDesign(
      bold,
      { background: '#00ff00' },
      { engine, ...testServices, source: 'mcp' },
    );
    expect(engine.log.map((e) => e.label)).toEqual([
      'bold-announcement design',
    ]);
    expect(sampleColor(engine.doc, 20, 540, 'layer_1')).toBe('#00ff00');
    expect(engine.doc.meta.layers.map((l) => l.name)).toEqual([
      'Background',
      'Decor',
      'Headline',
      'Subline',
      'Handle',
    ]);
  });
});
