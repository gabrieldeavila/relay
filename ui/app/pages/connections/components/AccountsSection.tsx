import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { useAccounts } from "../hooks/useAccounts";
import { AiAccountCard } from "./AiAccountCard";
import { EmailAccountCard } from "./EmailAccountCard";
import { TelegramAccountCard } from "./TelegramAccountCard";

/** Where steps deliver results: email, Telegram, and the AI step's key. */
export const AccountsSection = memo(() => {
  const { t } = useTranslation("connections");
  const accounts = useAccounts();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">{t("accounts.title")}</h2>
        <p className="text-(--color-text-muted)">{t("accounts.subtitle")}</p>
      </header>
      {accounts.error && <Alert variant="danger">{accounts.error}</Alert>}
      {!accounts.accounts && !accounts.error ? (
        <Spinner />
      ) : (
        <>
          <EmailAccountCard accounts={accounts} />
          <TelegramAccountCard accounts={accounts} />
          <AiAccountCard accounts={accounts} />
        </>
      )}
    </section>
  );
});

AccountsSection.displayName = "AccountsSection";
