/**
 * Field type system for nextjs-studio.
 *
 * Each field type is a discriminated union member keyed by `type`.
 * UI components and the type generator both derive behavior from this shape,
 * so adding a new type here automatically propagates to both.
 */

// ---------------------------------------------------------------------------
// Branded scalar types
// ---------------------------------------------------------------------------
// These are structurally strings/numbers at runtime but carry a type-level
// brand so the editor and consumer API can distinguish them semantically.
// Use the helper `brand()` at runtime to cast raw values.

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** A valid email address string, e.g. `"user@example.com"`. */
export type Email = Brand<string, "Email">;

/** A valid URL string, e.g. `"https://example.com"`. */
export type HttpUrl = Brand<string, "HttpUrl">;

/** An ISO 8601 date string without time, e.g. `"2025-03-08"`. */
export type ISODate = Brand<string, "ISODate">;


/** A relative file path or URL pointing to a media asset. */
export type MediaPath = Brand<string, "MediaPath">;

/** An auto-generated unique identifier (UUID / nanoid / cuid). */
export type ID = Brand<string, "ID">;

/** A URL-friendly slug, e.g. `"my-post-title"`. */
export type Slug = Brand<string, "Slug">;

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Base — properties shared by every field
// ---------------------------------------------------------------------------

interface BaseField {
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

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Structured types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Others / advanced
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Collection schema
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// TypeScript inference utilities
// ---------------------------------------------------------------------------
// These allow the consume API (queryCollection) to return fully-typed data
// when the caller passes a schema reference.

/** Infer the TypeScript value type for a single field definition. */
export type InferFieldValue<F extends FieldDefinition> =
  // Plain text — no semantic meaning beyond "a string"
  F extends TextField ? string
  : F extends LongTextField ? string
  // Numerics
  : F extends NumberField ? number
  : F extends BooleanField ? boolean
  // Date: includeTime drives which branded type is returned
  : F extends DateField
    ? F["includeTime"] extends true
      ? Date
      : ISODate
  // Select options become a string literal union when options are known
  : F extends SelectField
    ? F["options"][number]["value"]
  : F extends MultiSelectField
    ? Array<F["options"][number]["value"]>
  // Semantically distinct string types
  : F extends UrlField ? HttpUrl
  : F extends EmailField ? Email
  : F extends MediaField ? MediaPath
  // Structured
  : F extends ObjectField ? InferObjectFields<F["fields"]>
  : F extends ArrayField ? Array<InferObjectFields<F["itemFields"]>>
  // Generated
  : F extends IdField ? ID
  : F extends SlugField ? Slug
  // Relations use plain string IDs (branded would require cross-schema refs)
  : F extends RelationField
    ? F["multiple"] extends true
      ? ID[]
      : ID
  // Formula result depends on declared resultType
  : F extends FormulaField
    ? F["resultType"] extends "number"
      ? number
      : F["resultType"] extends "boolean"
        ? boolean
        : string
  : F extends StatusField
    ? F["options"][number]["value"]
  // System timestamps are always full datetime
  : F extends CreatedTimeField ? Date
  : F extends UpdatedTimeField ? Date
  : never;

/**
 * Infer a record type from an array of field definitions.
 * Fields marked `required: false` become optional (`T | undefined`).
 */
export type InferObjectFields<Fields extends FieldDefinition[]> = {
  [F in Fields[number] as F["name"]]: F extends { required: false }
    ? InferFieldValue<F> | undefined
    : InferFieldValue<F>;
};

/**
 * Infer the full data shape of a collection from its schema.
 *
 * @example
 * ```ts
 * const blogSchema = {
 *   collection: "blog",
 *   fields: [
 *     { name: "title", type: "text", required: true },
 *     { name: "published", type: "boolean" },
 *   ],
 * } satisfies CollectionSchema;
 *
 * type BlogData = InferSchemaData<typeof blogSchema>;
 * // => { title: string; published: boolean }
 * ```
 */
export type InferSchemaData<S extends CollectionSchema> = InferObjectFields<
  S["fields"]
>;

// ---------------------------------------------------------------------------
// Label utility
// ---------------------------------------------------------------------------

/**
 * Resolve the human-readable label for a field.
 *
 * When the field definition has an explicit `label`, that is returned as-is.
 * Otherwise the `name` (or any camelCase / kebab-case / snake_case key) is
 * converted to a Title Case phrase:
 *
 * @example
 * fieldLabel({ name: "siteName", type: "text" }) // "Site Name"
 * fieldLabel({ name: "created_at", type: "date" }) // "Created At"
 * fieldLabel({ name: "bio", type: "long-text", label: "About" }) // "About"
 */
export function fieldLabel(field: Pick<BaseField, "name" | "label">): string {
  if (field.label) return field.label;
  return field.name
    .replace(/[-_](.)/g, (_, c: string) => ` ${c.toUpperCase()}`)
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve the label for a raw key string (no field definition available).
 * Useful for dynamic keys that have no schema entry.
 */
export function keyLabel(name: string): string {
  return fieldLabel({ name });
}
