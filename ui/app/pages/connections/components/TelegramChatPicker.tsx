import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { useTelegramChats } from "../hooks/useTelegramChats";

type TelegramChatPickerProps = {
  chatId: string | undefined;
  onPick: (chatId: string) => void;
};

/** "Send a message to your bot, then find it here": no numeric ids to look up. */
export const TelegramChatPicker = memo(
  ({ chatId, onPick }: TelegramChatPickerProps) => {
    const { t } = useTranslation("connections");
    const lookup = useTelegramChats();

    return (
      <div className="flex flex-col gap-2 rounded-(--radius-md) bg-(--color-surface-2) p-3">
        <p className="text-sm">
          {chatId
            ? t("accounts.telegram.chatSet", { chatId })
            : t("accounts.telegram.noChat")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="self-start"
          isLoading={lookup.loading}
          leftIcon={<FiSearch aria-hidden="true" />}
          onClick={() => void lookup.find()}
        >
          {t("accounts.telegram.findChat")}
        </Button>
        {lookup.error && <Alert variant="danger">{lookup.error}</Alert>}
        {lookup.chats?.length === 0 && (
          <p className="text-sm text-(--color-text-muted)">
            {t("accounts.telegram.noChatsYet")}
          </p>
        )}
        {lookup.chats?.map((chat) => (
          <Button
            key={chat.id}
            type="button"
            size="sm"
            variant={chat.id === chatId ? "primary" : "ghost"}
            className="self-start"
            onClick={() => onPick(chat.id)}
          >
            {chat.name} ·{" "}
            {t(`accounts.telegram.chatType.${chat.type}`, {
              defaultValue: chat.type,
            })}
          </Button>
        ))}
      </div>
    );
  },
);

TelegramChatPicker.displayName = "TelegramChatPicker";
