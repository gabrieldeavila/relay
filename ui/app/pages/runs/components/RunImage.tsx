import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/ui/components/primitives/spinner";
import type { OutputImage } from "../domain/output-image";
import { useAuthorizedImage } from "../hooks/useAuthorizedImage";

/** The image a step produced, with where it is saved on this computer. */
export const RunImage = memo(({ image }: { image: OutputImage }) => {
  const { t } = useTranslation("runs");
  const { src, failed } = useAuthorizedImage(image.url);

  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold">{t("step.image")}</h3>
      {src ? (
        <img
          src={src}
          alt={t("step.imageAlt")}
          className="max-h-80 w-full rounded-(--radius-sm) border border-(--color-border) object-contain"
        />
      ) : failed ? (
        <p className="text-sm text-(--color-danger)">
          {t("step.imageMissing")}
        </p>
      ) : (
        <Spinner />
      )}
      <code className="break-all text-xs text-(--color-text-muted)">
        {image.path}
      </code>
    </section>
  );
});

RunImage.displayName = "RunImage";
