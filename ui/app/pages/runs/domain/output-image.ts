export interface OutputImage {
  url: string;
  path: string;
}

/** The image a step produced (e.g. Pincel's render_image), if any. */
export function outputImage(output: unknown): OutputImage | null {
  if (typeof output !== "object" || output === null) return null;
  const image = (output as { image?: unknown }).image;
  if (typeof image !== "object" || image === null) return null;
  const { url, path } = image as { url?: unknown; path?: unknown };
  return typeof url === "string" && typeof path === "string"
    ? { url, path }
    : null;
}
