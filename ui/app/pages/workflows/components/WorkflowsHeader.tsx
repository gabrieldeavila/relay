import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiLogOut, FiPlus } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { supabase } from "@/app/auth/api/supabase-client";
import { LanguageSelect } from "@/app/components/LanguageSelect";

type WorkflowsHeaderProps = { onCreate: () => void };

export const WorkflowsHeader = memo(({ onCreate }: WorkflowsHeaderProps) => {
  const { t } = useTranslation(["workflows", "auth"]);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-(--color-text-muted)">{t("subtitle")}</p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSelect />
        <Button
          variant="ghost"
          leftIcon={<FiLogOut aria-hidden="true" />}
          onClick={() => void supabase.auth.signOut()}
        >
          {t("auth:signOut")}
        </Button>
        <Button leftIcon={<FiPlus aria-hidden="true" />} onClick={onCreate}>
          {t("create")}
        </Button>
      </div>
    </header>
  );
});

WorkflowsHeader.displayName = "WorkflowsHeader";
