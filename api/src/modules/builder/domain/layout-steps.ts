const COLUMN = 300;
const ROW = 160;

/**
 * Left-to-right positions: each step one column after the furthest step
 * leading to it, steps in the same column stacked in plan order. Branches
 * fan out below the main line. Cycles (invalid anyway) do not loop forever.
 */
export function layoutSteps(
  stepIds: string[],
  links: { from: string; to: string }[],
): Map<string, { x: number; y: number }> {
  const columns = columnOf(stepIds, links);
  const rowsUsed = new Map<number, number>();
  const positions = new Map<string, { x: number; y: number }>();
  for (const id of stepIds) {
    const column = columns.get(id) ?? 0;
    const row = rowsUsed.get(column) ?? 0;
    rowsUsed.set(column, row + 1);
    positions.set(id, { x: column * COLUMN, y: row * ROW });
  }
  return positions;
}

/** Longest path from a step without inputs, capped at the number of steps. */
function columnOf(stepIds: string[], links: { from: string; to: string }[]) {
  const known = new Set(stepIds);
  const usable = links.filter((l) => known.has(l.from) && known.has(l.to));
  const columns = new Map(stepIds.map((id) => [id, 0]));
  for (let pass = 0; pass < stepIds.length; pass++) {
    let changed = false;
    for (const { from, to } of usable) {
      const next = Math.min(columns.get(from)! + 1, stepIds.length);
      if (next > columns.get(to)!) {
        columns.set(to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return columns;
}
