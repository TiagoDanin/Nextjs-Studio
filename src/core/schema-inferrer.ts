/**
 * @context  Core layer — schema inferrer at src/core/schema-inferrer.ts
 * @does     Infers a CollectionSchema from actual content entries when no manual schema is defined
 * @depends  src/shared/types.ts, src/shared/fields.ts
 * @do       Add new type detection heuristics here (e.g. color, phone)
 * @dont     Import from CLI or UI; access the filesystem; perform I/O
 */

import type { ContentEntry } from "../shared/types.js";
import type { CollectionSchema, FieldDefinition, SelectOption } from "../shared/fields.js";

// Value detector patterns
const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_URL = /^https?:\/\/.+/;
const LONG_TEXT_THRESHOLD = 200;

function isISODate(value: string): boolean {
  return RE_ISO_DATE.test(value);
}

function isISODateTime(value: string): boolean {
  return RE_ISO_DATETIME.test(value);
}

function isEmail(value: string): boolean {
  return RE_EMAIL.test(value);
}

function isUrl(value: string): boolean {
  return RE_URL.test(value);
}

function inferStringField(name: string, strings: string[]): FieldDefinition {
  if (strings.every(isEmail)) return { name, type: "email" };
  if (strings.every(isUrl)) return { name, type: "url" };
  if (strings.every(isISODateTime)) return { name, type: "date", includeTime: true };
  if (strings.every(isISODate)) return { name, type: "date" };

  const isLong = strings.some((s) => s.length > LONG_TEXT_THRESHOLD || s.includes("\n"));
  return { name, type: isLong ? "long-text" : "text" };
}

function inferArrayField(name: string, items: unknown[]): FieldDefinition {
  if (items.length === 0) return { name, type: "array", itemFields: [] };

  if (items.every((item) => typeof item === "string")) {
    const unique = [...new Set(items as string[])].slice(0, 50);
    const options: SelectOption[] = unique.map((v) => ({ label: v, value: v }));
    return { name, type: "multi-select", options };
  }

  if (items.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
    return { name, type: "array", itemFields: inferFields(items as Record<string, unknown>[]) };
  }

  return { name, type: "array", itemFields: [] };
}

function inferFieldDefinition(name: string, values: unknown[]): FieldDefinition {
  const present = values.filter((v) => v !== null && v !== undefined);

  if (present.length === 0) return { name, type: "text" };
  if (present.every((v) => typeof v === "boolean")) return { name, type: "boolean" };

  if (present.every((v) => typeof v === "number")) {
    const format = present.every((v) => Number.isInteger(v)) ? "integer" : "decimal";
    return { name, type: "number", format };
  }

  if (present.every((v) => typeof v === "string")) {
    return inferStringField(name, present as string[]);
  }

  if (present.every((v) => Array.isArray(v))) {
    return inferArrayField(name, (present as unknown[][]).flat());
  }

  if (present.every((v) => typeof v === "object" && v !== null && !Array.isArray(v))) {
    return { name, type: "object", fields: inferFields(present as Record<string, unknown>[]) };
  }

  return { name, type: "text" };
}

function inferFields(rows: Record<string, unknown>[]): FieldDefinition[] {
  const keySet = new Set<string>(rows.flatMap((row) => Object.keys(row)));
  return Array.from(keySet).map((key) => inferFieldDefinition(key, rows.map((row) => row[key])));
}

/**
 * Infer a `CollectionSchema` from the data of a set of content entries.
 *
 * The result is a best-effort approximation — string fields that look like
 * emails, URLs, or ISO dates get the correct semantic type. Everything else
 * falls back to `text`.
 */
export function inferSchema(entries: ContentEntry[], collectionName: string): CollectionSchema {
  const rows = entries.map((entry) => entry.data as Record<string, unknown>);
  return { collection: collectionName, fields: inferFields(rows) };
}
