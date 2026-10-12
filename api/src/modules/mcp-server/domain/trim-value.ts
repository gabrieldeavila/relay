/**
 * Keeps a step's data small enough for an AI's context: anything whose JSON
 * is longer than `limit` becomes its first characters plus a note.
 */
export function trimValue(value: unknown, limit = 2_000): unknown {
  if (value === undefined) return null;
  const json = JSON.stringify(value);
  if (json === undefined || json.length <= limit) return value;
  return `${json.slice(0, limit)}… (${json.length - limit} more characters; see the run page)`;
}
