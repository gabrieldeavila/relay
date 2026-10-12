import { memo, useId, useState } from "react";

import { Textarea } from "@/ui/components/primitives/textarea";
import { formatLooseValue, parseLooseValue } from "../../domain/loose-value";
import { ExpressionMenu } from "./ExpressionMenu";
import { FieldLabel } from "./FieldLabel";
import { appendExpression, type FieldProps } from "./field-props";

/**
 * Free value: text, a `{{ }}` value, or JSON. Keeps its own text while typing
 * so half-written JSON is never reformatted under the cursor.
 */
export const AnyField = memo(
  ({ field, label, value, onChange, choices }: FieldProps) => {
    const id = useId();
    const [text, setText] = useState(() => formatLooseValue(value));
    const update = (next: string) => {
      setText(next);
      onChange(next === "" ? undefined : parseLooseValue(next));
    };

    return (
      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor={id}
          label={label}
          required={field.required}
          action={
            <ExpressionMenu
              choices={choices}
              onInsert={(e) => update(appendExpression(text, e))}
            />
          }
        />
        <Textarea
          id={id}
          rows={3}
          value={text}
          onChange={(event) => update(event.target.value)}
        />
      </div>
    );
  },
);

AnyField.displayName = "AnyField";
