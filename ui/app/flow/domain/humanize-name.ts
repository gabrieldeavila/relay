/** `maxSize` → "Max size", `font_family` → "Font family": labels for unknown field names. */
export function humanizeName(name: string): string {
  const text = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Tool nodes come from connected apps: their names are not in our translations. */
export const isToolType = (type: string) => type.startsWith("tool:");
