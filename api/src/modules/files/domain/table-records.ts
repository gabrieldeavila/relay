export type Cell = string | number | boolean | null;
export type TableRow = Record<string, Cell>;

export interface Table {
  columns: string[];
  rows: TableRow[];
  /** More rows than a step keeps; only the first `limit` came along. */
  truncated: boolean;
}

/**
 * The first non-empty row names the columns, so later steps can say
 * `row.quote` instead of `row[0]`. Blank rows are dropped.
 */
export function tableRecords(grid: Cell[][], limit: number): Table {
  const rows = grid.filter((cells) => cells.some(hasValue));
  const [header = [], ...body] = rows;
  const columns = columnNames(header);
  return {
    columns,
    rows: body.slice(0, limit).map((cells) => record(columns, cells)),
    truncated: body.length > limit,
  };
}

function record(columns: string[], cells: Cell[]): TableRow {
  return Object.fromEntries(
    columns.map((column, i) => [column, clean(cells[i])]),
  );
}

/** Trimmed header text; blanks become `column_3`, repeats `name_2`. */
function columnNames(header: Cell[]): string[] {
  const seen = new Map<string, number>();
  return header.map((cell, i) => {
    const base = String(cell ?? '').trim() || `column_${i + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function clean(cell: Cell | undefined): Cell {
  if (cell === undefined) return null;
  return typeof cell === 'string' ? cell.trim() : cell;
}

const hasValue = (cell: Cell) =>
  cell !== null && (typeof cell !== 'string' || cell.trim() !== '');
