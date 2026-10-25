import { memo } from "react";

import { cn } from "@/ui/helpers/cn";
import { clipLabel, type PlacedClip } from "../domain/timeline-rows";

const KIND_COLORS: Record<PlacedClip["kind"], string> = {
  media: "bg-(--color-primary)/30 border-(--color-primary)/60",
  image: "bg-(--color-success)/25 border-(--color-success)/60",
  text: "bg-(--color-warning)/25 border-(--color-warning)/60",
};

type ClipBarProps = { clip: PlacedClip };

export const ClipBar = memo(({ clip }: ClipBarProps) => (
  <div
    title={`${clip.id} · ${clipLabel(clip)}`}
    className={cn(
      "absolute inset-y-1 overflow-hidden rounded-(--radius-xs) border px-1.5 text-xs leading-6 whitespace-nowrap",
      KIND_COLORS[clip.kind],
    )}
    style={{ left: `${clip.leftPercent}%`, width: `${clip.widthPercent}%` }}
  >
    {clipLabel(clip)}
  </div>
));

ClipBar.displayName = "ClipBar";
