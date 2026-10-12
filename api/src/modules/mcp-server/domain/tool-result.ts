/** A tool answer as JSON text, which every MCP client can read. */
export const jsonResult = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

/** The tool ran but could not do it; the message tells the AI what to change. */
export const errorResult = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});
