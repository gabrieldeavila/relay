/**
 * Readable ids, because people see them in `{{ steps.<id>.output }}`:
 * `http.request` → `request`, `tool:<app>:draw_text` → `draw_text`,
 * then `request-2`, `request-3`…
 */
export function nextNodeId(type: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = (type.split(/[.:]/).pop() ?? "step")
    .replace(/[^a-z0-9_-]/gi, "-")
    .toLowerCase();
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}
