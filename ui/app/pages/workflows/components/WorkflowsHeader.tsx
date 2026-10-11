import { memo } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSelect } from "@/app/components/LanguageSelect";

export const WorkflowsHeader = memo(() => {
  const { t } = useTranslation("workflows");

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-(--color-text-muted)">{t("subtitle")}</p>
      </div>
      <LanguageSelect />
    </header>
  );
});

WorkflowsHeader.displayName = "WorkflowsHeader";
