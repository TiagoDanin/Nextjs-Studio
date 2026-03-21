/**
 * @context  Shared layer — field type system at src/shared/fields.ts
 * @does     Defines every field interface, the FieldDefinition union, and CollectionSchema
 * @depends  none
 * @do       Add new field types here; the UI and type-generator derive behavior from this shape
 * @dont     Import from CLI or UI; contain runtime logic beyond fieldLabel utilities
 */

// Branded scalar types — structurally strings/numbers at runtime but semantically distinct.
// Use a type cast at runtime to assign branded values.
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type Email = Brand<string, "Email">;
export type HttpUrl = Brand<string, "HttpUrl">;
export type ISODate = Brand<string, "ISODate">;
export type MediaPath = Brand<string, "MediaPath">;
export type ID = Brand<string, "ID">;
export type Slug = Brand<string, "Slug">;

// Shared primitives

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export interface StatusOption {
  label: string;
  value: string;
  /** Semantic color bucket — maps to a badge color in the editor. */
  color?: "gray" | "red" | "yellow" | "green" | "blue" | "purple";
}

// Base — properties shared by every field

export interface BaseField {
  /** Machine-readable key used in the data object / JSON key. */
  name: string;
  /** Human-readable label shown in the editor. Defaults to `name`. */
  label?: string;
  /** Whether the field must have a non-empty value. */
  required?: boolean;
  /** Helper text shown below the input in the editor. */
  description?: string;
  /** Default value used when creating a new entry. */
  defaultValue?: unknown;
}

// Scalar field types

export interface TextField extends BaseField {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

export interface LongTextField extends BaseField {
  type: "long-text";
  placeholder?: string;
  /** Minimum visible rows in the textarea. */
  rows?: number;
}

export interface NumberField extends BaseField {
  type: "number";
  format?: "integer" | "decimal";
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanField extends BaseField {
  type: "boolean";
  defaultValue?: boolean;
}

export interface DateField extends BaseField {
  type: "date";
  /**
   * When `true` the editor renders a datetime-picker (date + time).
   * When `false` or omitted it renders a date-only picker.
   */
  includeTime?: boolean;
  /**
   * When `false` the editor hides the day picker, rendering a month-year picker (`type="month"`).
   * When `true` or omitted: default behavior (full date or datetime).
   */
  includeDay?: boolean;
  /**
   * When `false` (AND `includeDay: false`) the editor renders a year-only picker (number input).
   * Only effective when `includeDay` is also `false`.
   */
  includeMonth?: boolean;
}

export interface SelectField extends BaseField {
  type: "select";
  options: SelectOption[];
  defaultValue?: string;
}

export interface MultiSelectField extends BaseField {
  type: "multi-select";
  options: SelectOption[];
  defaultValue?: string[];
}

export interface UrlField extends BaseField {
  type: "url";
  placeholder?: string;
}

export interface EmailField extends BaseField {
  type: "email";
  placeholder?: string;
}

export interface MediaField extends BaseField {
  type: "media";
  /** Accepted MIME types or extensions, e.g. `["image/*"]`. */
  accept?: string[];
}

// Structured field types

export interface ObjectField extends BaseField {
  type: "object";
  /** Nested field definitions rendered as a form. */
  fields: FieldDefinition[];
}

export interface ArrayField extends BaseField {
  type: "array";
  /** Shape of each item in the array — rendered as a sheet (table). */
  itemFields: FieldDefinition[];
}

export interface IdField extends BaseField {
  type: "id";
  /** Strategy for auto-generating IDs. Defaults to `"nanoid"`. */
  generate?: "uuid" | "nanoid" | "cuid";
}

export interface SlugField extends BaseField {
  type: "slug";
  /** Name of the field whose value is used as the slug source. */
  from: string;
}

// Advanced field types

export interface RelationField extends BaseField {
  type: "relation";
  /** Target collection name. */
  collection: string;
  /** Allow selecting multiple entries. */
  multiple?: boolean;
}

export interface FormulaField extends BaseField {
  type: "formula";
  /**
   * Expression string evaluated at read time.
   * Syntax TBD — placeholder for v2.
   */
  expression: string;
  /** TypeScript type that the expression produces. Used by the type generator. */
  resultType?: "string" | "number" | "boolean";
}

export interface StatusField extends BaseField {
  type: "status";
  options: StatusOption[];
  defaultValue?: string;
}

export interface CreatedTimeField extends BaseField {
  type: "created-time";
}

export interface UpdatedTimeField extends BaseField {
  type: "updated-time";
}

// Union

export type FieldDefinition =
  | TextField
  | LongTextField
  | NumberField
  | BooleanField
  | DateField
  | SelectField
  | MultiSelectField
  | UrlField
  | EmailField
  | MediaField
  | ObjectField
  | ArrayField
  | IdField
  | SlugField
  | RelationField
  | FormulaField
  | StatusField
  | CreatedTimeField
  | UpdatedTimeField;

export type FieldType = FieldDefinition["type"];

// Collection schema

export interface CollectionSchema {
  /** Collection name — must match the folder name under /contents. */
  collection: string;
  /**
   * Human-readable label for the collection.
   * Defaults to the collection name with title case.
   */
  label?: string;
  /** Field definitions that describe the shape of each entry. */
  fields: FieldDefinition[];
}
