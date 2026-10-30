import { DEFAULT_TEXT_STYLE } from '../../videos/domain/default-text-style.js';
import type { TextStyle } from '../../videos/domain/timeline-types.js';
import type { TextTemplate } from './text-template.js';
import { templateTextStyle } from './template-text-style.js';

/** A text style from the defaults, then the template, then the fields given. */
export function resolveTextStyle(
  template: TextTemplate | null,
  given: Partial<TextStyle>,
): TextStyle {
  const fields = withoutUndefined(given);
  const size = fields.size ?? DEFAULT_TEXT_STYLE.size;
  return {
    ...DEFAULT_TEXT_STYLE,
    ...(template ? templateTextStyle(template, size) : {}),
    ...fields,
  };
}

function withoutUndefined<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
