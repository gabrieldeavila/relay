import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { useTemplates } from "../hooks/useTemplates";
import { TemplateCard } from "./TemplateCard";

/** "Start from a template": templates first, for people who never built a flow. */
export const TemplatesSection = memo(() => {
  const { t } = useTranslation("templates");
  const { templates, busyId, error, start } = useTemplates();
  if (!templates && !error) return null;

  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-(--color-text-muted)">{t("subtitle")}</p>
      </header>
      {error && <Alert variant="danger">{error}</Alert>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <li key={template.id}>
            <TemplateCard
              template={template}
              busy={busyId === template.id}
              onUse={(name) => void start(template.id, name)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
});

TemplatesSection.displayName = "TemplatesSection";
