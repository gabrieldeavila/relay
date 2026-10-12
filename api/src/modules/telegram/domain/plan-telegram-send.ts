/** Telegram's limits for one message and for a photo's caption. */
export const MESSAGE_LIMIT = 4096;
export const CAPTION_LIMIT = 1024;

export type TelegramCall =
  | { method: 'sendMessage'; text: string }
  | { method: 'sendPhoto'; photoPath: string; caption?: string };

/**
 * The calls that deliver some text and/or a picture: the text rides along as
 * the caption when it fits, otherwise it follows in its own messages.
 */
export function planTelegramSend({
  text,
  imagePath,
}: {
  text?: string;
  imagePath?: string;
}): TelegramCall[] {
  const body = text?.trim() ?? '';
  if (!imagePath) return splitText(body).map(message);
  if (body.length <= CAPTION_LIMIT) {
    return [
      { method: 'sendPhoto', photoPath: imagePath, caption: body || undefined },
    ];
  }
  return [
    { method: 'sendPhoto', photoPath: imagePath },
    ...splitText(body).map(message),
  ];
}

const message = (text: string): TelegramCall => ({
  method: 'sendMessage',
  text,
});

/** Splits long text at line breaks (or spaces) so no message is cut mid-word. */
export function splitText(text: string, limit = MESSAGE_LIMIT): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const cut = Math.max(window.lastIndexOf('\n'), window.lastIndexOf(' '));
    const at = cut > limit / 2 ? cut : limit;
    parts.push(rest.slice(0, at).trimEnd());
    rest = rest.slice(at).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}
