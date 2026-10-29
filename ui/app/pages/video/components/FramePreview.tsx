import { memo, type RefObject } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/ui/helpers/cn";
import { formatSeconds } from "@/app/format/format-seconds";
import { frameUrl } from "../api/video-api";

type FramePreviewProps = {
  id: string;
  /** The playhead, shown under the picture. */
  time: number;
  /** The still frame to show while paused. */
  frameTime: number;
  version: number;
  width: number;
  height: number;
  isEmpty: boolean;
  /** The preview mp4, once rendered; shown on top while playing. */
  videoUrl: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onEnded: () => void;
};

/**
 * The frame at the playhead, rendered by Relay exactly as the export will look;
 * while playing, the preview video (same render, smaller) takes its place.
 */
export const FramePreview = memo(
  ({
    id,
    time,
    frameTime,
    version,
    width,
    height,
    isEmpty,
    videoUrl,
    videoRef,
    isPlaying,
    onEnded,
  }: FramePreviewProps) => {
    const { t } = useTranslation("video");

    return (
      <figure className="flex flex-col items-center gap-2">
        <div
          className="relative flex max-h-[60dvh] w-full items-center justify-center overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-black"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {isEmpty ? (
            <p className="p-6 text-center text-sm text-(--color-text-muted)">
              {t("empty")}
            </p>
          ) : (
            <img
              src={frameUrl(id, frameTime, version)}
              alt={t("frameAt", { time: formatSeconds(frameTime) })}
              className="h-full w-full object-contain"
            />
          )}
          {videoUrl && (
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              preload="auto"
              playsInline
              onEnded={onEnded}
              className={cn(
                "absolute inset-0 h-full w-full bg-black object-contain",
                !isPlaying && "invisible",
              )}
            />
          )}
        </div>
        <figcaption className="text-sm text-(--color-text-muted) tabular-nums">
          {formatSeconds(time)}
        </figcaption>
      </figure>
    );
  },
);

FramePreview.displayName = "FramePreview";
