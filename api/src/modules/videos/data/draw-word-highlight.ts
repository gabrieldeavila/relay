import { drawText, lineWidth } from '../../images/domain/paint/draw-text.js';
import type { Ctx } from '../../images/domain/paint/surface.js';
import {
  alignOffset,
  cssFont,
  textLines,
} from '../../images/domain/paint/text-layout.js';
import type { Point } from '../../images/domain/document/types.js';
import { locateWord } from '../domain/locate-word.js';
import type { TextHighlight, TextStyle } from '../domain/timeline-types.js';

/** Text after layout: its wrapped lines, final size and top-anchor position. */
export interface LaidOutText {
  text: string;
  size: number;
  position: Point;
}

interface PlacedWord {
  word: string;
  x: number;
  y: number;
  width: number;
}

/** A rounded box behind the highlighted word; draw it before the text. */
export function drawHighlightBox(
  ctx: Ctx,
  layout: LaidOutText,
  style: TextStyle,
  highlight: TextHighlight,
) {
  const placed = placeWord(ctx, layout, style, highlight.word);
  if (!placed || !highlight.background) return;
  const pad = layout.size * 0.15;
  ctx.save();
  ctx.fillStyle = highlight.background;
  ctx.beginPath();
  ctx.roundRect(
    placed.x - pad,
    placed.y - pad * 0.6,
    placed.width + pad * 2,
    layout.size + pad * 1.2,
    pad,
  );
  ctx.fill();
  ctx.restore();
}

/** The highlighted word again, in its own color, over the text already drawn. */
export function drawHighlightWord(
  ctx: Ctx,
  layout: LaidOutText,
  style: TextStyle,
  highlight: TextHighlight,
) {
  const placed = placeWord(ctx, layout, style, highlight.word);
  if (!placed) return;
  ctx.save();
  drawText(ctx, {
    type: 'draw_text',
    layerId: 'highlight',
    text: placed.word,
    position: [placed.x, placed.y],
    size: layout.size,
    color: highlight.color,
    font: style.font,
    weight: style.weight,
    align: 'left',
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    stroke: style.stroke ?? undefined,
    strokeWidth: style.strokeWidth,
  });
  ctx.restore();
}

/** Where the word lands when the whole text is drawn, in canvas pixels. */
function placeWord(
  ctx: Ctx,
  layout: LaidOutText,
  style: TextStyle,
  index: number,
): PlacedWord | null {
  const lines = textLines(layout.text);
  const found = locateWord(lines, index);
  if (!found) return null;
  const spacing = style.letterSpacing;
  ctx.save();
  ctx.font = cssFont(style.weight, layout.size, style.font);
  ctx.letterSpacing = `${spacing}px`;
  const lineStart = alignOffset(
    style.align,
    lineWidth(ctx, lines[found.line], spacing),
  );
  // Measured with the letter spacing after each letter, as fillText advances.
  const before = found.before ? ctx.measureText(found.before).width : 0;
  const width = lineWidth(ctx, found.word, spacing);
  ctx.restore();
  return {
    word: found.word,
    x: layout.position[0] + lineStart + before,
    y: layout.position[1] + found.line * layout.size * style.lineHeight,
    width,
  };
}
