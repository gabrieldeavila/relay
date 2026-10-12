import { useState } from "react";

import { listTelegramChats, type TelegramChat } from "../api/accounts-api";

/** Chats that wrote to the bot lately, looked up when the person asks. */
export const useTelegramChats = () => {
  const [chats, setChats] = useState<TelegramChat[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    setLoading(true);
    setError(null);
    try {
      setChats(await listTelegramChats());
    } catch (findError) {
      setError((findError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { chats, loading, error, find };
};
