import { memo, useId } from "react";

import { Textarea } from "@/ui/components/primitives/textarea";
import { ExpressionMenu } from "./ExpressionMenu";
import { FieldLabel } from "./FieldLabel";
import { appendExpression, type FieldProps } from "./field-props";

/** Multi-line text, e.g. an email body or a prompt; values go in with "Use a value". */
export const LongTextField = memo(
  ({ field, label, value, onChange, choices }: FieldProps) => {
    const id = useId();
    const text = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor={id}
          label={label}
          required={field.required}
          action={
            <ExpressionMenu
              choices={choices}
              onInsert={(e) => onChange(appendExpression(text, e))}
            />
          }
        />
        <Textarea
          id={id}
          rows={5}
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      </div>
    );
  },
);

LongTextField.displayName = "LongTextField";
