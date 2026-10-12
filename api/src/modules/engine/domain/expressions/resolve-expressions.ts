import { ExpressionError } from './expression-error.js';
import { parsePath } from './parse-path.js';
import { isMissing, readPath } from './read-path.js';
import { stringifyValue } from './stringify-value.js';

/** What a step's config can refer to. */
export interface ExpressionContext {
  trigger: unknown;
  /**
   * `resumeUrl` + `/<nodeId>` resumes a waiting step from another app;
   * `link` opens the run in Relay (e.g. to approve it there).
   */
  run: { id: string; resumeUrl: string; link: string };
  /** Settled steps: `output` when they succeeded, `error` when they failed. */
  steps: Record<string, { output: unknown; error?: unknown }>;
}

const ROOTS = new Set(['trigger', 'run', 'steps']);
const TEMPLATE = /\{\{\s*([^}]*?)\s*\}\}/g;
const WHOLE = /^\{\{\s*([^}]*?)\s*\}\}$/;

/**
 * Replaces `{{ path }}` in every string of a config, recursively. A string that
 * is exactly one expression keeps the value's type (number, object, list);
 * otherwise values are written into the text.
 */
export function resolveExpressions<T>(value: T, context: ExpressionContext): T {
  return resolveValue(value, context) as T;
}

function resolveValue(value: unknown, context: ExpressionContext): unknown {
  if (typeof value === 'string') return resolveString(value, context);
  if (Array.isArray(value))
    return value.map((item) => resolveValue(item, context));
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveValue(item, context),
      ]),
    );
  }
  return value;
}

function resolveString(text: string, context: ExpressionContext): unknown {
  const whole = WHOLE.exec(text);
  if (whole) return evaluate(whole[1], context);
  return text.replace(TEMPLATE, (_match, expression: string) =>
    stringifyValue(evaluate(expression, context)),
  );
}

function evaluate(expression: string, context: ExpressionContext): unknown {
  const segments = parsePath(expression);
  if (!ROOTS.has(String(segments[0]))) {
    throw new ExpressionError(expression, 'unknown_root');
  }
  const value = readPath(context, segments);
  if (isMissing(value)) throw new ExpressionError(expression, 'not_found');
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
