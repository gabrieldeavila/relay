import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/ui/components/primitives/button";
import { designPreviewUrl } from "../api/templates-api";
import { thumbnailAspect } from "../domain/aspect-ratio";
import type { DesignTemplateEntry } from "../domain/design-template";
import { humanize } from "../domain/group-templates";

type TemplateCardProps = {
  template: DesignTemplateEntry;
  creating: boolean;
  disabled: boolean;
  onUse: (name: string) => void;
};

/** A template's preview, what it is, and a button to start an image from it. */
export const TemplateCard = memo(
  ({ template, creating, disabled, onUse }: TemplateCardProps) => {
    const { t } = useTranslation("home");

    return (
      <li className="flex flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface)">
        <div
          className="flex items-center justify-center bg-(--color-bg)"
          style={{
            aspectRatio: thumbnailAspect(template.width, template.height),
          }}
        >
          <img
            src={designPreviewUrl(template.name)}
            alt={humanize(template.name)}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <p className="truncate font-medium">{humanize(template.name)}</p>
            <p className="text-xs text-(--color-text-muted)">
              {template.width}×{template.height}
              {template.builtIn ? "" : ` · ${t("templates.saved")}`}
            </p>
            <p className="text-sm text-(--color-text-muted)">
              {template.description}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="mt-auto"
            isLoading={creating}
            disabled={disabled}
            onClick={() => onUse(template.name)}
          >
            {t("templates.use")}
          </Button>
        </div>
      </li>
    );
  },
);

TemplateCard.displayName = "TemplateCard";
