import type { FieldDescriptor } from "../../domain/schema-fields";
import type { ExpressionChoice } from "../../hooks/useExpressionChoices";

/** What every config field receives from the panel. */
export interface FieldProps {
  field: FieldDescriptor;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  choices: ExpressionChoice[];
}

/** Appends an inserted expression to existing text, with a space if needed. */
export const appendExpression = (text: string, expression: string) =>
  text && !text.endsWith(" ") ? `${text} ${expression}` : `${text}${expression}`;
