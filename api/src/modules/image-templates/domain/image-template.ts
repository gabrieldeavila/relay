/** One image tool call in a template, with the same input as calling the tool. */
export interface TemplateStep {
  tool: string;
  /** Strings like "$layer" or "$width*0.5" are filled in when applied (see template-placeholders). */
  input: Record<string, unknown>;
}

/** A reusable edit: a list of image tool calls applied to a layer as one undo step. */
export interface ImageTemplate {
  /** Lowercase, words joined by "-", e.g. "my-look". */
  name: string;
  description: string;
  steps: TemplateStep[];
}

export interface ListedImageTemplate extends ImageTemplate {
  builtIn: boolean;
}
