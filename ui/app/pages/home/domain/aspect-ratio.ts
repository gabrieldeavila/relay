/** CSS aspect-ratio for a thumbnail, kept between 9:16 and 16:9 so cards line up. */
export function thumbnailAspect(width: number, height: number): string {
  const ratio = Math.min(16 / 9, Math.max(9 / 16, width / height));
  return String(Math.round(ratio * 1000) / 1000);
}
