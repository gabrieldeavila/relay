import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { humanize } from "../domain/group-templates";
import { useDesignTemplates } from "../hooks/useDesignTemplates";
import { TemplateCard } from "./TemplateCard";

/** Canva-style gallery: pick a design, get a new image to keep editing with Claude. */
export const TemplatesTab = memo(() => {
  const { t } = useTranslation("home");
  const { groups, error, creating, startFromTemplate } = useDesignTemplates();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-(--color-text-muted)">{t("templates.hint")}</p>
      {error && <Alert variant="danger">{error}</Alert>}
      {!groups && !error && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}
      {groups?.map((group) => (
        <section key={group.category} className="flex flex-col gap-3">
          <h2 className="font-semibold">
            {t(`templates.categories.${group.category}`, {
              defaultValue: humanize(group.category),
            })}
          </h2>
          <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.templates.map((template) => (
              <TemplateCard
                key={template.name}
                template={template}
                creating={creating === template.name}
                disabled={creating !== null}
                onUse={startFromTemplate}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
});

TemplatesTab.displayName = "TemplatesTab";
