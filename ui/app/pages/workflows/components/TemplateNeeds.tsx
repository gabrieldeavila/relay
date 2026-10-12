import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/components/primitives/badge";
import type { TemplateNeed } from "../api/templates-api";

type TemplateNeedsProps = { needs: TemplateNeed[] };

/** What a template uses, green when already set up. */
export const TemplateNeeds = memo(({ needs }: TemplateNeedsProps) => {
  const { t } = useTranslation("templates");
  return (
    <ul className="flex flex-wrap gap-1.5">
      {needs.map((need) => (
        <li key={`${need.kind}:${need.key}`}>
          <Badge
            size="sm"
            variant={need.ready ? "success" : "warning"}
            showIndicator
          >
            {need.kind === "app" ? need.name : t(`needs.${need.key}`)}
            {" · "}
            {need.ready ? t("ready") : t("missing")}
          </Badge>
        </li>
      ))}
    </ul>
  );
});

TemplateNeeds.displayName = "TemplateNeeds";
