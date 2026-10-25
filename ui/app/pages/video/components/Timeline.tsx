import { memo, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { formatSeconds } from "@/app/format/format-seconds";
import { timeAt, timelineRows } from "../domain/timeline-rows";
import type { TimelineClip } from "../domain/types";
import { ClipBar } from "./ClipBar";

type TimelineProps = {
  clips: TimelineClip[];
  duration: number;
  time: number;
  onSeek: (time: number) => void;
};

/** Read-only tracks, top layer first; click anywhere to preview that moment. */
export const Timeline = memo(
  ({ clips, duration, time, onSeek }: TimelineProps) => {
    const { t } = useTranslation("video");
    const rows = timelineRows(clips, duration);

    const seek = (event: MouseEvent<HTMLDivElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      onSeek(timeAt((event.clientX - box.left) / box.width, duration));
    };

    if (rows.length === 0) return null;
    return (
      <section className="flex flex-col gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3">
        <div className="flex justify-between text-xs text-(--color-text-muted)">
          <span>{t("timeline")}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
        <div className="flex gap-2">
          <ol className="flex w-20 shrink-0 flex-col gap-1 text-xs whitespace-nowrap text-(--color-text-muted)">
            {rows.map((row) => (
              <li key={row.layer} className="h-8 leading-8">
                {t("layer", { layer: row.layer })}
              </li>
            ))}
          </ol>
          <div className="relative flex-1 cursor-pointer" onClick={seek}>
            {rows.map((row) => (
              <div
                key={row.layer}
                className="relative mb-1 h-8 rounded-(--radius-xs) bg-(--color-surface-2)"
              >
                {row.clips.map((clip) => (
                  <ClipBar key={clip.id} clip={clip} />
                ))}
              </div>
            ))}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-(--color-text)"
              style={{ left: `${duration > 0 ? (time / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </section>
    );
  },
);

Timeline.displayName = "Timeline";
