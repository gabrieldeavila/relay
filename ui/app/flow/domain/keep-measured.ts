type Measured = { id: string; measured?: { width?: number; height?: number } };

/** Rebuilt nodes keep the size React Flow already measured, so they stay visible. */
export function keepMeasured<T extends Measured>(
  next: T[],
  previous: Measured[],
): T[] {
  const sizes = new Map(previous.map((node) => [node.id, node.measured]));
  return next.map((node) =>
    sizes.get(node.id) ? { ...node, measured: sizes.get(node.id) } : node,
  );
}
