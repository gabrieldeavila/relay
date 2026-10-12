import { formatLooseValue, parseLooseValue } from "./loose-value";

export interface KeyValueRow {
  name: string;
  value: string;
}

export const rowsFromRecord = (record: unknown): KeyValueRow[] =>
  typeof record === "object" && record !== null && !Array.isArray(record)
    ? Object.entries(record).map(([name, value]) => ({
        name,
        value: formatLooseValue(value),
      }))
    : [];

/**
 * Rows being edited → the stored object. Rows without a name are kept on
 * screen but not saved; free values (`any`) may hold JSON.
 */
export function recordFromRows(
  rows: KeyValueRow[],
  valueKind: "text" | "any",
): Record<string, unknown> {
  return Object.fromEntries(
    rows
      .filter((row) => row.name.trim())
      .map((row) => [
        row.name.trim(),
        valueKind === "any" ? parseLooseValue(row.value) : row.value,
      ]),
  );
}
