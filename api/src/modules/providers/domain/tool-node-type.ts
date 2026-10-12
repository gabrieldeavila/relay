const PREFIX = 'tool';

/** Node type of a provider's tool: `tool:<providerId>:<toolName>`. */
export const toolNodeType = (providerId: string, toolName: string) =>
  `${PREFIX}:${providerId}:${toolName}`;

export function parseToolNodeType(
  type: string,
): { providerId: string; toolName: string } | null {
  const [prefix, providerId, toolName, ...rest] = type.split(':');
  if (prefix !== PREFIX || !providerId || !toolName || rest.length) return null;
  return { providerId, toolName };
}

/** `draw_text` → "Draw text", `openImage` → "Open image". */
export function toolTitle(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
