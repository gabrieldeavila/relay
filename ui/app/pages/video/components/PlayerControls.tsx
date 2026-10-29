import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiPause, FiPlay } from "react-icons/fi";

import { IconButton } from "@/ui/components/primitives/icon-button";
import { Spinner } from "@/ui/components/primitives/spinner";
import type { VideoPreview } from "../domain/types";

type PlayerControlsProps = {
  isPlaying: boolean;
  isWaiting: boolean;
  preview: VideoPreview | null;
  onToggle: () => void;
};

/** Play/pause, and how the preview render is going while it gets ready. */
export const PlayerControls = memo(
  ({ isPlaying, isWaiting, preview, onToggle }: PlayerControlsProps) => {
    const { t } = useTranslation("video");
    const progress = Math.round((preview?.progress ?? 0) * 100);

    return (
      <div className="flex items-center gap-3">
        <IconButton
          label={isPlaying ? t("player.pause") : t("player.play")}
          icon={isPlaying ? <FiPause /> : <FiPlay />}
          variant="primary"
          onClick={onToggle}
          disabled={isWaiting}
        />
        {isWaiting && (
          <span className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <Spinner size="sm" />
            {t("player.preparing", { progress })}
          </span>
        )}
        {preview?.status === "failed" && (
          <span className="text-sm text-(--color-danger)">
            {t("player.failed", { error: preview.error })}
          </span>
        )}
      </div>
    );
  },
);

PlayerControls.displayName = "PlayerControls";
