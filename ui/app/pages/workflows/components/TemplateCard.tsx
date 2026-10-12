import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiLink } from "react-icons/fi";
import { Link } from "react-router";

import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import type { TemplateSummary } from "../api/templates-api";
import { TemplateNeeds } from "./TemplateNeeds";

type TemplateCardProps = {
  template: TemplateSummary;
  busy: boolean;
  onUse: (name: string) => void;
};

export const TemplateCard = memo(
  ({ template, busy, onUse }: TemplateCardProps) => {
    const { t } = useTranslation("templates");
    const title = t(`${template.id}.title`, { defaultValue: template.title });
    const allReady = template.needs.every((need) => need.ready);

    return (
      <Card className="flex h-full flex-col">
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          <p className="text-sm text-(--color-text-muted)">
            {t(`${template.id}.description`, {
              defaultValue: template.description,
            })}
          </p>
        </Card.Header>
        <Card.Body className="flex-1">
          <TemplateNeeds needs={template.needs} />
        </Card.Body>
        <Card.Footer className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={!template.canUse}
            isLoading={busy}
            onClick={() => onUse(title)}
          >
            {t("use")}
          </Button>
          {!allReady && (
            <Link
              to="/connections"
              className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-text)"
            >
              <FiLink aria-hidden="true" />
              {t(template.canUse ? "setUpLater" : "connectFirst")}
            </Link>
          )}
        </Card.Footer>
      </Card>
    );
  },
);

TemplateCard.displayName = "TemplateCard";
