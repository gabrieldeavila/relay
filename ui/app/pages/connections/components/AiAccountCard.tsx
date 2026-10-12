import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/ui/components/primitives/input";
import { useAccountCard } from "../hooks/useAccountCard";
import type { AccountsState } from "../hooks/useAccounts";
import { AccountCard } from "./AccountCard";

type AiAccountCardProps = { accounts: AccountsState };

export const AiAccountCard = memo(({ accounts }: AiAccountCardProps) => {
  const { t } = useTranslation("connections");
  const card = useAccountCard("ai", accounts);
  const [key, setKey] = useState("");

  return (
    <AccountCard
      title={t("accounts.ai.title")}
      description={t("accounts.ai.description")}
      card={card}
      onSubmit={(event) => {
        void card.submit(event, {}, key || undefined);
        setKey("");
      }}
    >
      <Input
        label={t("accounts.ai.key")}
        type="password"
        autoComplete="off"
        required={!card.saved}
        placeholder={card.saved ? t("accounts.keepSecret") : "sk-ant-…"}
        hint={t("accounts.ai.keyHint")}
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
    </AccountCard>
  );
});

AiAccountCard.displayName = "AiAccountCard";
