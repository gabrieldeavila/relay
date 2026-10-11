import type { PathSegment } from './parse-path.js';

const MISSING = Symbol('missing');

/**
 * Own properties only, so `constructor` or `__proto__` never reach JS internals.
 * Returns MISSING (not undefined) when a segment does not exist.
 */
export function readPath(root: unknown, segments: PathSegment[]): unknown {
  let current = root;
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') return MISSING;
    if (!Object.hasOwn(current, segment)) return MISSING;
    current = (current as Record<PathSegment, unknown>)[segment];
  }
  return current;
}

export const isMissing = (value: unknown): value is typeof MISSING =>
  value === MISSING;
