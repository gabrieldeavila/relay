export type DesignFieldKind = "text" | "image" | "color";

/** A design template as the gallery gets it from the API. */
export type DesignTemplateEntry = {
  name: string;
  description: string;
  category: string;
  width: number;
  height: number;
  builtIn: boolean;
  fields: {
    key: string;
    kind: DesignFieldKind;
    label: string;
    default?: string;
  }[];
};

export type TemplateGroup = {
  category: string;
  templates: DesignTemplateEntry[];
};
