import { stringifyValue } from '../../engine/domain/expressions/stringify-value.js';

export const CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/**
 * Compares a resolved value the way a non-programmer would expect:
 * "10" equals 10, contains works on text and lists, empty covers "" and [].
 */
export function evaluateCondition(
  value: unknown,
  operator: ConditionOperator,
  compare?: unknown,
): boolean {
  switch (operator) {
    case 'equals':
      return looseEquals(value, compare);
    case 'not_equals':
      return !looseEquals(value, compare);
    case 'contains':
      return contains(value, compare);
    case 'greater_than':
      return toNumber(value) > toNumber(compare);
    case 'less_than':
      return toNumber(value) < toNumber(compare);
    case 'is_empty':
      return isEmpty(value);
    case 'is_not_empty':
      return !isEmpty(value);
  }
}

function looseEquals(left: unknown, right: unknown) {
  if (isNumeric(left) && isNumeric(right)) {
    return toNumber(left) === toNumber(right);
  }
  return stringifyValue(left) === stringifyValue(right);
}

function contains(haystack: unknown, needle: unknown) {
  if (Array.isArray(haystack)) {
    return haystack.some((item) => looseEquals(item, needle));
  }
  return stringifyValue(haystack)
    .toLowerCase()
    .includes(stringifyValue(needle).toLowerCase());
}

function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function isNumeric(value: unknown) {
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)))
  );
}

function toNumber(value: unknown) {
  return isNumeric(value) ? Number(value) : NaN;
}
