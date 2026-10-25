import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { ExportedAsset } from "../domain/types";

type ExportPanelProps = { exported: ExportedAsset | null };

/** The latest exported mp4, playable here. */
export const ExportPanel = memo(({ exported }: ExportPanelProps) => {
  const { t } = useTranslation("video");

  return (
    <section className="flex flex-col gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3">
      <h2 className="text-sm font-semibold text-(--color-text-muted)">
        {t("export.title")}
      </h2>
      {exported ? (
        <video
          key={exported.url}
          src={exported.url}
          controls
          className="max-h-[50dvh] w-full rounded-(--radius-sm) bg-black"
        />
      ) : (
        <p className="text-sm text-(--color-text-muted)">{t("export.none")}</p>
      )}
    </section>
  );
});

ExportPanel.displayName = "ExportPanel";
