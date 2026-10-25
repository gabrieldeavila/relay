import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiFilm } from "react-icons/fi";

import { videoThumbnailUrl } from "../api/studio-api";
import type { VideoSummary } from "../domain/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectGrid } from "./ProjectGrid";

type VideosTabProps = { videos: VideoSummary[] | null; error: string | null };

export const VideosTab = memo(({ videos, error }: VideosTabProps) => {
  const { t } = useTranslation("home");

  return (
    <ProjectGrid
      loading={!videos}
      error={error}
      isEmpty={videos?.length === 0}
      empty={{
        icon: <FiFilm />,
        title: t("videos.emptyTitle"),
        description: t("videos.emptyDescription"),
      }}
    >
      {videos?.map((video) => (
        <ProjectCard
          key={video.id}
          to={`/videos/${video.id}`}
          name={video.name}
          thumbnailUrl={videoThumbnailUrl(video)}
          width={video.setup.width}
          height={video.setup.height}
          updatedAt={video.updatedAt}
          detail={`${video.setup.width}×${video.setup.height} · ${video.setup.fps} fps`}
          placeholder={<FiFilm />}
        />
      ))}
    </ProjectGrid>
  );
});

VideosTab.displayName = "VideosTab";
