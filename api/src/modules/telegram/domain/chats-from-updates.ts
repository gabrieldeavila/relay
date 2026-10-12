export interface TelegramChat {
  id: string;
  name: string;
  type: string;
}

interface RawChat {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

type RawUpdate = Partial<
  Record<
    'message' | 'edited_message' | 'channel_post' | 'my_chat_member',
    { chat?: RawChat }
  >
>;

/**
 * Chats that recently wrote to the bot (or added it), newest first, so a
 * person can pick "my chat" instead of looking up a numeric id.
 */
export function chatsFromUpdates(updates: RawUpdate[]): TelegramChat[] {
  const chats = new Map<string, TelegramChat>();
  for (const update of [...updates].reverse()) {
    const chat =
      update.message?.chat ??
      update.edited_message?.chat ??
      update.channel_post?.chat ??
      update.my_chat_member?.chat;
    if (!chat || chats.has(String(chat.id))) continue;
    chats.set(String(chat.id), {
      id: String(chat.id),
      name: chatName(chat),
      type: chat.type,
    });
  }
  return [...chats.values()];
}

function chatName(chat: RawChat): string {
  if (chat.title) return chat.title;
  const person = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  return person || (chat.username ? `@${chat.username}` : String(chat.id));
}
