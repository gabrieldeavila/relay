import type { Layer } from "./types";

/** "80% · multiply · mask": only what differs from a plain layer. */
export function layerSummary(layer: Layer): string {
  const parts: string[] = [];
  if (layer.opacity < 1) parts.push(`${Math.round(layer.opacity * 100)}%`);
  if (layer.blendMode !== "normal") parts.push(layer.blendMode);
  if (layer.mask) parts.push("mask");
  return parts.join(" · ");
}

/** Like a layers panel: the top layer first. */
export const layersTopFirst = (layers: Layer[]) => [...layers].reverse();
