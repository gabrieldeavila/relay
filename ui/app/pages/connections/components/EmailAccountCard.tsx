import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/ui/components/primitives/checkbox";
import { Input } from "@/ui/components/primitives/input";
import { useAccountCard } from "../hooks/useAccountCard";
import type { AccountsState } from "../hooks/useAccounts";
import { useEmailForm } from "../hooks/useEmailForm";
import { AccountCard } from "./AccountCard";

type EmailAccountCardProps = { accounts: AccountsState };

export const EmailAccountCard = memo(({ accounts }: EmailAccountCardProps) => {
  const { t } = useTranslation("connections");
  const card = useAccountCard("email", accounts);
  const form = useEmailForm(card.saved);
  const { fields } = form;

  return (
    <AccountCard
      title={t("accounts.email.title")}
      description={t("accounts.email.description")}
      card={card}
      onSubmit={(event) =>
        void card.submit(event, form.settings(), fields.password || undefined)
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("accounts.email.user")}
          type="email"
          required
          value={fields.user}
          onChange={(e) => form.setUser(e.target.value)}
          onBlur={form.fillServer}
        />
        <Input
          label={t("accounts.email.password")}
          type="password"
          autoComplete="new-password"
          required={!card.saved}
          placeholder={card.saved ? t("accounts.keepSecret") : undefined}
          hint={t("accounts.email.passwordHint")}
          value={fields.password}
          onChange={(e) => form.setPassword(e.target.value)}
        />
        <Input
          label={t("accounts.email.host")}
          required
          placeholder="smtp.example.com"
          value={fields.host}
          onChange={(e) => form.setHost(e.target.value)}
        />
        <Input
          label={t("accounts.email.port")}
          type="number"
          required
          value={fields.port}
          onChange={(e) => form.setPort(e.target.value)}
        />
        <Input
          label={t("accounts.email.from")}
          placeholder={t("accounts.email.fromPlaceholder")}
          value={fields.from}
          onChange={(e) => form.setFrom(e.target.value)}
        />
        <Checkbox
          className="self-end pb-2"
          label={t("accounts.email.secure")}
          checked={fields.secure}
          onChange={(e) => form.setSecure(e.target.checked)}
        />
      </div>
    </AccountCard>
  );
});

EmailAccountCard.displayName = "EmailAccountCard";
