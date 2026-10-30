import type { TextStyle } from '../../videos/domain/timeline-types.js';

/**
 * A reusable text look: font, colors and outline. Sizes are shares of the font
 * size, so one template fits a big title and a small caption alike.
 */
export interface TextTemplate {
  /** Lowercase, words joined by "-", e.g. "my-brand". */
  name: string;
  description: string;
  /** CSS font family list, e.g. "Montserrat, sans-serif". */
  font: string;
  weight: TextStyle['weight'];
  color: string;
  stroke: string | null;
  /** Outline thickness as a share of the font size. */
  strokeRatio: number;
  background: string | null;
  uppercase: boolean;
  /** Extra space between letters as a share of the font size. */
  letterSpacingRatio: number;
  lineHeight: number;
}

export interface ListedTemplate extends TextTemplate {
  builtIn: boolean;
}
