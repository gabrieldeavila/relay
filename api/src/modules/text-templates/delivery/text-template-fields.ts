import { z } from 'zod';

export const templateField = z
  .string()
  .describe(
    'Text template name, e.g. "pop", "news", "elegant" or one the person saved (list_text_templates). Sets font, colors, outline and case; its font downloads automatically',
  );
