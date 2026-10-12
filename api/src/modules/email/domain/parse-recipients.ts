const ADDRESS = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export type Recipients =
  { ok: true; addresses: string[] } | { ok: false; invalid: string[] };

/** "ana@x.com, bia@y.com; caio@z.com" → addresses; anything else is reported. */
export function parseRecipients(text: string): Recipients {
  const items = text
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const invalid = items.filter((item) => !ADDRESS.test(item));
  return invalid.length
    ? { ok: false, invalid }
    : { ok: true, addresses: [...new Set(items)] };
}
