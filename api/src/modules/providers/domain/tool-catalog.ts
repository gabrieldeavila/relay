import { z } from 'zod';

const toolSchema = z.object({
  name: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,64}$/, 'Tool names are letters, digits, _ and -'),
  description: z.string().default(''),
  input_schema: z.record(z.string(), z.unknown()),
});

/** One tool in the Claude API tool format (what Pincel serves at /api/tools). */
export type ToolDescriptor = z.infer<typeof toolSchema>;

/** Reads a provider's catalog; throws a readable error when it is not one. */
export function parseToolCatalog(body: unknown): ToolDescriptor[] {
  const parsed = z.array(toolSchema).safeParse(body);
  if (!parsed.success) {
    throw new Error(`Not a tool list: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
