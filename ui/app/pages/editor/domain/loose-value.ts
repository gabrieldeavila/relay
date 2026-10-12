/**
 * Free fields take any value but are typed as text. Text that is a JSON
 * object or list becomes that value; everything else stays text (expressions
 * included). `"10"` stays text: conditions already compare it as a number.
 */
export function parseLooseValue(text: string): unknown {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed)) return text;
  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

/** How a stored value shows up in a text box. */
export function formatLooseValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value as number | boolean);
}
