import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiImage } from "react-icons/fi";

import { imageThumbnailUrl } from "../api/studio-api";
import type { ImageSummary } from "../domain/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectGrid } from "./ProjectGrid";

type ImagesTabProps = { images: ImageSummary[] | null; error: string | null };

export const ImagesTab = memo(({ images, error }: ImagesTabProps) => {
  const { t } = useTranslation("home");

  return (
    <ProjectGrid
      loading={!images}
      error={error}
      isEmpty={images?.length === 0}
      empty={{
        icon: <FiImage />,
        title: t("images.emptyTitle"),
        description: t("images.emptyDescription"),
      }}
    >
      {images?.map((image) => (
        <ProjectCard
          key={image.id}
          to={`/images/${image.id}`}
          name={image.name}
          thumbnailUrl={imageThumbnailUrl(image)}
          width={image.setup.width}
          height={image.setup.height}
          updatedAt={image.updatedAt}
          detail={`${image.setup.width}×${image.setup.height}`}
          placeholder={<FiImage />}
        />
      ))}
    </ProjectGrid>
  );
});

ImagesTab.displayName = "ImagesTab";
