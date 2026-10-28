import { createCanvas } from '@napi-rs/canvas';
import { resolveText } from '../../images/data/resolve-text.js';
import { drawText } from '../../images/domain/paint/draw-text.js';
import type { TextClip, VideoSetup } from '../domain/timeline-types.js';
import { drawHighlightBox, drawHighlightWord } from './draw-word-highlight.js';

/**
 * A transparent full-frame PNG with the clip's text, drawn by the image
 * editor's text engine so fonts and layout match in both services.
 */
export function renderTextOverlay(clip: TextClip, setup: VideoSetup): Buffer {
  const canvas = createCanvas(setup.width, setup.height);
  const ctx = canvas.getContext('2d');
  const { box, style, highlight } = clip;
  if (style.background) {
    ctx.fillStyle = style.background;
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }
  const layout = layoutOf(clip);
  if (highlight) drawHighlightBox(ctx, layout, style, highlight);
  ctx.save();
  drawText(ctx, {
    type: 'draw_text',
    layerId: clip.id,
    text: layout.text,
    position: layout.position,
    size: layout.size,
    color: style.color,
    font: style.font,
    weight: style.weight,
    align: style.align,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    stroke: style.stroke ?? undefined,
    strokeWidth: style.strokeWidth,
  });
  ctx.restore();
  if (highlight) drawHighlightWord(ctx, layout, style, highlight);
  return canvas.toBuffer('image/png');
}

/** Notes about the text worth telling the AI (missing fonts, overflow). */
export function textNotes(clip: TextClip): string[] {
  return layoutOf(clip).notes;
}

function layoutOf(clip: TextClip) {
  const { style } = clip;
  return resolveText({
    text: clip.text,
    size: style.size,
    lineHeight: style.lineHeight,
    align: style.align,
    box: clip.box,
    fit: style.fit,
    minSize: 8,
    verticalAlign: style.verticalAlign,
    font: style.font,
    weight: style.weight,
    letterSpacing: style.letterSpacing,
  });
}
