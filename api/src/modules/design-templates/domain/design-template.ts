import type { TemplateStep } from '../../image-templates/domain/image-template.js';

/** Something the person fills in: a text, a photo or a color. */
export interface DesignField {
  kind: 'text' | 'image' | 'color';
  /** Short name shown to the person, e.g. "Headline". */
  label: string;
  /** Used when the field isn't given. Image fields have none: they show a placeholder. */
  default?: string;
}

/**
 * A step of a design. Strings may contain "{{field}}", filled with the field's
 * value (an asset id for image fields). `when`/`unless` keep the step only if
 * that field was / wasn't given, e.g. the photo vs. its placeholder.
 */
export interface DesignStep extends TemplateStep {
  when?: string;
  unless?: string;
}

export interface FontNeed {
  /** Google Fonts family, e.g. "Bebas Neue". */
  family: string;
  weights: string[];
}

/** A ready-made design, like a Canva template: a canvas size plus the steps that draw it. */
export interface DesignTemplate {
  /** Lowercase, words joined by "-", e.g. "bold-announcement". */
  name: string;
  description: string;
  /** What it's for, e.g. "instagram-post"; the gallery groups by it. */
  category: string;
  width: number;
  height: number;
  background: string;
  fonts: FontNeed[];
  fields: Record<string, DesignField>;
  steps: DesignStep[];
}

export interface ListedDesignTemplate extends DesignTemplate {
  builtIn: boolean;
}

/** What each field is set to; image fields hold an asset id. */
export type FieldValues = Record<string, string>;
