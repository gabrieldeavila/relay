import type { DesignStep, FontNeed } from './design-template.js';

/** Small step builders so built-in designs read like a list of elements. */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FONTS = {
  anton: { family: 'Anton', weights: ['400'] },
  bebas: { family: 'Bebas Neue', weights: ['400'] },
  montserrat: { family: 'Montserrat', weights: ['400', '700'] },
  playfair: { family: 'Playfair Display', weights: ['700'] },
} satisfies Record<string, FontNeed>;

export const FONT = {
  anton: 'Anton, Impact, sans-serif',
  bebas: 'Bebas Neue, Impact, sans-serif',
  montserrat: 'Montserrat, Helvetica, sans-serif',
  playfair: 'Playfair Display, Georgia, serif',
};

export const layer = (name: string): DesignStep => ({
  tool: 'add_layer',
  input: { name },
});

/** Fills the Background layer the document starts with. */
export const background = (color: string): DesignStep => ({
  tool: 'fill_layer',
  input: { layerId: 'layer_1', color },
});

export const rect = (box: Box, fill: string, radius = 0): DesignStep => ({
  tool: 'draw_rect',
  input: { rect: box, fill, radius },
});

export const circle = (
  center: [number, number],
  radius: number,
  fill: string,
): DesignStep => ({
  tool: 'draw_ellipse',
  input: { center, radiusX: radius, radiusY: radius, fill },
});

/** Text that shrinks to fit its box, so longer words still fit the design. */
export const text = (
  value: string,
  box: Box,
  style: Record<string, unknown>,
): DesignStep => ({
  tool: 'draw_text',
  input: { text: value, box, fit: 'shrink', minSize: 12, ...style },
});

export const gradient = (
  from: [number, number],
  to: [number, number],
  colors: [string, string],
): DesignStep => ({
  tool: 'draw_gradient',
  input: {
    from,
    to,
    stops: [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[1] },
    ],
  },
});

/**
 * A photo cropped to `frame`, or a gray "Your photo here" box until one is
 * given. `labelBox` moves the label where the design's text won't cover it.
 */
export function photoSlot(
  field: string,
  frame: Box,
  labelBox: Box = frame,
): DesignStep[] {
  return [
    layer('Photo'),
    {
      tool: 'place_image',
      input: { assetId: `{{${field}}}`, fit: 'cover', frame },
      when: field,
    },
    { ...rect(frame, '#d4d4d8'), unless: field },
    {
      ...text('Your photo here', labelBox, {
        size: 44,
        color: '#71717a',
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        verticalAlign: 'middle',
      }),
      unless: field,
    },
  ];
}
