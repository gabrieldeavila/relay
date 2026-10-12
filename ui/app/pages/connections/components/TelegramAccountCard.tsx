import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/ui/components/primitives/input";
import { useAccountCard } from "../hooks/useAccountCard";
import type { AccountsState } from "../hooks/useAccounts";
import { AccountCard } from "./AccountCard";
import { TelegramChatPicker } from "./TelegramChatPicker";

type TelegramAccountCardProps = { accounts: AccountsState };

export const TelegramAccountCard = memo(
  ({ accounts }: TelegramAccountCardProps) => {
    const { t } = useTranslation("connections");
    const card = useAccountCard("telegram", accounts);
    const [token, setToken] = useState("");
    const chatId = card.saved?.settings.chatId as string | undefined;
    const settings = chatId ? { chatId } : {};

    return (
      <AccountCard
        title={t("accounts.telegram.title")}
        description={t("accounts.telegram.description")}
        card={card}
        onSubmit={(event) => {
          void card.submit(event, settings, token || undefined);
          setToken("");
        }}
        extra={
          <TelegramChatPicker
            chatId={chatId}
            onPick={(id) => void card.update({ chatId: id })}
          />
        }
      >
        <Input
          label={t("accounts.telegram.token")}
          type="password"
          autoComplete="off"
          required={!card.saved}
          placeholder={card.saved ? t("accounts.keepSecret") : "123456:ABC…"}
          hint={t("accounts.telegram.tokenHint")}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </AccountCard>
    );
  },
);

TelegramAccountCard.displayName = "TelegramAccountCard";
