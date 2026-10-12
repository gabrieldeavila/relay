import type { JsonSchema } from "./types";

export type FieldKind =
  | "text"
  | "number"
  | "select"
  | "boolean"
  | "keyValue"
  | "schedule"
  | "any";

export interface FieldDescriptor {
  name: string;
  kind: FieldKind;
  required: boolean;
  options?: string[];
  /** For `keyValue`: whether values are plain text or free values. */
  valueKind?: "text" | "any";
  placeholder?: string;
}

/** Turns a node's config JSON Schema into the fields of its form, in order. */
export function schemaFields(schema: JsonSchema): FieldDescriptor[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([name, field]) => ({
    name,
    required: required.has(name) && field.default === undefined,
    ...describe(field),
  }));
}

function describe(field: JsonSchema): Omit<FieldDescriptor, "name" | "required"> {
  if (field.oneOf?.some((option) => option.properties?.every?.const)) {
    return { kind: "schedule" };
  }
  if (field.enum) return { kind: "select", options: field.enum.map(String) };
  switch (field.type) {
    case "string":
      return field.format === "uri"
        ? { kind: "text", placeholder: "https://" }
        : { kind: "text" };
    case "number":
    case "integer":
      return { kind: "number" };
    case "boolean":
      return { kind: "boolean" };
    case "object":
      return isRecord(field)
        ? { kind: "keyValue", valueKind: valueKindOf(field) }
        : { kind: "any" };
    default:
      return { kind: "any" };
  }
}

const isRecord = (field: JsonSchema) =>
  typeof field.additionalProperties === "object";

function valueKindOf(field: JsonSchema): "text" | "any" {
  const values = field.additionalProperties;
  return typeof values === "object" && values.type === "string" ? "text" : "any";
}
