const SAFE = /^[A-Za-z0-9_-]{1,64}$/;
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** `<nodeId>-<attempt>.<ext>`: one file per attempt, so retries never overwrite. */
export function runFileName(nodeId: string, attempt: number, mimeType: string) {
  if (!SAFE.test(nodeId))
    throw new Error(`Unsafe step id for a file name: ${nodeId}`);
  return `${nodeId}-${attempt}.${EXTENSIONS[mimeType] ?? 'bin'}`;
}

/** Guards the `/files/:runId/:name` route against paths like `../`. */
export const isSafeFileName = (name: string) =>
  /^[A-Za-z0-9_-]{1,64}\.[a-z]{2,4}$/.test(name);
