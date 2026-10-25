import { memo } from "react";
import { useTranslation } from "react-i18next";

import { formatSeconds } from "@/app/format/format-seconds";
import { frameUrl } from "../api/video-api";

type FramePreviewProps = {
  id: string;
  time: number;
  version: number;
  width: number;
  height: number;
  isEmpty: boolean;
};

/** The frame at the playhead, rendered by Relay exactly as the export will look. */
export const FramePreview = memo(
  ({ id, time, version, width, height, isEmpty }: FramePreviewProps) => {
    const { t } = useTranslation("video");

    return (
      <figure className="flex flex-col items-center gap-2">
        <div
          className="flex max-h-[60dvh] w-full items-center justify-center overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-black"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {isEmpty ? (
            <p className="p-6 text-center text-sm text-(--color-text-muted)">
              {t("empty")}
            </p>
          ) : (
            <img
              src={frameUrl(id, time, version)}
              alt={t("frameAt", { time: formatSeconds(time) })}
              className="h-full w-full object-contain"
            />
          )}
        </div>
        <figcaption className="text-sm text-(--color-text-muted)">
          {formatSeconds(time)}
        </figcaption>
      </figure>
    );
  },
);

FramePreview.displayName = "FramePreview";
