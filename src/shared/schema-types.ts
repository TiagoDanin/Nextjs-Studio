/**
 * @context  Shared layer — schema inference types at src/shared/schema-types.ts
 * @does     Provides TypeScript utility types to infer typed data shapes from CollectionSchema
 * @depends  src/shared/fields.ts
 * @do       Add new schema-level inference utilities here
 * @dont     Import from CLI or UI; contain runtime logic or field definitions
 */

import type {
  FieldDefinition,
  CollectionSchema,
  TextField,
  LongTextField,
  NumberField,
  BooleanField,
  DateField,
  SelectField,
  MultiSelectField,
  UrlField,
  EmailField,
  MediaField,
  ObjectField,
  ArrayField,
  IdField,
  SlugField,
  RelationField,
  FormulaField,
  StatusField,
  CreatedTimeField,
  UpdatedTimeField,
  Email,
  HttpUrl,
  ISODate,
  MediaPath,
  ID,
  Slug,
} from "./fields.js";

/** Infer the TypeScript value type for a single field definition. */
export type InferFieldValue<F extends FieldDefinition> =
  F extends TextField ? string
  : F extends LongTextField ? string
  : F extends NumberField ? number
  : F extends BooleanField ? boolean
  : F extends DateField
    ? F["includeTime"] extends true ? Date : ISODate
  : F extends SelectField
    ? F["options"][number]["value"]
  : F extends MultiSelectField
    ? Array<F["options"][number]["value"]>
  : F extends UrlField ? HttpUrl
  : F extends EmailField ? Email
  : F extends MediaField ? MediaPath
  : F extends ObjectField ? InferObjectFields<F["fields"]>
  : F extends ArrayField ? Array<InferObjectFields<F["itemFields"]>>
  : F extends IdField ? ID
  : F extends SlugField ? Slug
  : F extends RelationField
    ? F["multiple"] extends true ? ID[] : ID
  : F extends FormulaField
    ? F["resultType"] extends "number"
      ? number
      : F["resultType"] extends "boolean"
        ? boolean
        : string
  : F extends StatusField
    ? F["options"][number]["value"]
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
export type InferSchemaData<S extends CollectionSchema> = InferObjectFields<S["fields"]>;
