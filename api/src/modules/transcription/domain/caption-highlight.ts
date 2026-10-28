import type { TextHighlight } from '../../videos/domain/timeline-types.js';

/** How the spoken word stands out: its color changes, or a box appears behind it. */
export const CAPTION_HIGHLIGHTS = ['color', 'box', 'none'] as const;
export type CaptionHighlightMode = (typeof CAPTION_HIGHLIGHTS)[number];

/** A highlight for whichever word is being said. */
export type WordHighlightLook = Omit<TextHighlight, 'word'>;

const DEFAULT_WORD_COLOR = '#ffe600';
const DEFAULT_BOX_COLOR = '#22c55e';

/**
 * The highlight for a mode. "color" defaults to yellow, or green when the
 * text is already yellow; "box" puts white text on a green box by default.
 */
export function captionHighlight(
  mode: CaptionHighlightMode,
  textColor: string,
  color?: string,
): WordHighlightLook | null {
  if (mode === 'none') return null;
  if (mode === 'box') {
    return { color: '#ffffff', background: color ?? DEFAULT_BOX_COLOR };
  }
  const fallback =
    textColor.toLowerCase() === DEFAULT_WORD_COLOR
      ? DEFAULT_BOX_COLOR
      : DEFAULT_WORD_COLOR;
  return { color: color ?? fallback, background: null };
}
