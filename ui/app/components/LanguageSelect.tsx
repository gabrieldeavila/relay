import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Select } from "@/ui/components/primitives/select";
import { changeLanguage, type SupportedLanguage } from "../i18n";

export const LanguageSelect = memo(() => {
  const { t, i18n } = useTranslation();

  return (
    <Select
      aria-label={t("language.label")}
      value={i18n.language}
      onChange={(event) =>
        void changeLanguage(event.target.value as SupportedLanguage)
      }
    >
      <option value="pt-BR">{t("language.portuguese")}</option>
      <option value="en">{t("language.english")}</option>
    </Select>
  );
});

LanguageSelect.displayName = "LanguageSelect";
