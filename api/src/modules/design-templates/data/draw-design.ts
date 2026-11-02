import type { DocumentEngine } from '../../images/data/document-engine.js';
import { runTool } from '../../images/delivery/tools/run-tool.js';
import { findTool } from '../../images/delivery/tools/tool-catalog.js';
import type {
  ToolContext,
  ToolServices,
} from '../../images/delivery/tools/tool-definition.js';
import type { DesignTemplate, FieldValues } from '../domain/design-template.js';
import { designSteps, fieldValues } from '../domain/fill-design.js';
import { ensureDesignFonts } from './ensure-design-fonts.js';
import { resolveImageFields } from './resolve-image-fields.js';

/** Draws a design onto a fresh document as one undo step; returns fonts that couldn't load. */
export async function drawDesign(
  template: DesignTemplate,
  given: FieldValues,
  ctx: ToolContext,
): Promise<{ missingFonts: string[] }> {
  const values = await resolveImageFields(
    template,
    fieldValues(template, given),
    ctx.assets,
  );
  const missingFonts = await ensureDesignFonts(ctx.fonts, template.fonts);
  await runTool(
    findTool('batch')!,
    { calls: designSteps(template, values), label: `${template.name} design` },
    ctx,
  );
  return { missingFonts };
}

/** Resets a scratch engine to the template's canvas and draws it with its defaults. */
export async function drawPreview(
  engine: DocumentEngine,
  template: DesignTemplate,
  services: Omit<ToolServices, 'engine'>,
): Promise<void> {
  await engine.reset(designSetup(template), 'rest');
  await drawDesign(template, {}, { engine, ...services, source: 'rest' });
}

export function designSetup(template: DesignTemplate) {
  return {
    width: template.width,
    height: template.height,
    background: template.background,
  };
}
