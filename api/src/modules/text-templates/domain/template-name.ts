/** The stored form of a template name: "My Brand" → "my-brand". */
export function templateKey(name: string): string {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!key) throw new Error('A template name needs letters or digits');
  return key;
}
