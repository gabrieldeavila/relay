import { ExpressionError } from './expression-error.js';

export type PathSegment = string | number;

const SEGMENT = /\.?([A-Za-z0-9_-]+)|\[(\d+)\]/y;

/** `steps.render.output.items[0].url` → ['steps', 'render', 'output', 'items', 0, 'url'] */
export function parsePath(expression: string): PathSegment[] {
  const segments: PathSegment[] = [];
  SEGMENT.lastIndex = 0;
  while (SEGMENT.lastIndex < expression.length) {
    const start = SEGMENT.lastIndex;
    const match = SEGMENT.exec(expression);
    if (!match || (start === 0 && expression.startsWith('.'))) {
      throw new ExpressionError(expression, 'syntax');
    }
    segments.push(match[1] ?? Number(match[2]));
  }
  if (segments.length === 0) throw new ExpressionError(expression, 'syntax');
  return segments;
}
