import type { TextStyle } from './timeline-types.js';

/** add_text's look when no template or field says otherwise. */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  font: 'sans-serif',
  size: 72,
  weight: 'bold',
  color: '#ffffff',
  align: 'center',
  verticalAlign: 'middle',
  lineHeight: 1.15,
  letterSpacing: 0,
  stroke: '#000000',
  strokeWidth: 4,
  background: null,
  fit: 'shrink',
};
