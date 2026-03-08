/**
 * Infers a CollectionSchema from actual content entries.
 *
 * When no schema is defined in studio.config.ts, this module inspects the
 * data values across all entries in a collection and produces a best-effort
 * schema so the editor and type generator always have something to work with.
 */

import type { ContentEntry } from "../shared/types.js";
import type {
  CollectionSchema,
  FieldDefinition,
  SelectOption,
} from "../shared/fields.js";

// ---------------------------------------------------------------------------
// Value detectors
// ---------------------------------------------------------------------------

const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_URL = /^https?:\/\/.+/;
const LONG_TEXT_THRESHOLD = 200;

function isISODate(v: string): boolean {
  return RE_ISO_DATE.test(v);
}

function isISODateTime(v: string): boolean {
  return RE_ISO_DATETIME.test(v);
}

function isEmail(v: string): boolean {
  return RE_EMAIL.test(v);
}

function isUrl(v: string): boolean {
  return RE_URL.test(v);
}

// ---------------------------------------------------------------------------
// Core inference — single field
// ---------------------------------------------------------------------------

function inferFieldDefinition(
  name: string,
  values: unknown[],
): FieldDefinition {
  const present = values.filter((v) => v !== null && v !== undefined);

  if (present.length === 0) {
    return { name, type: "text" };
  }

  // Boolean
  if (present.every((v) => typeof v === "boolean")) {
    return { name, type: "boolean" };
  }

  // Number
  if (present.every((v) => typeof v === "number")) {
    const format = present.every((v) => Number.isInteger(v))
      ? "integer"
      : "decimal";
    return { name, type: "number", format };
  }

  // String — check specific subtypes from most to least specific
  if (present.every((v) => typeof v === "string")) {
    const strings = present as string[];

    if (strings.every(isEmail)) {
      return { name, type: "email" };
    }

    if (strings.every(isUrl)) {
      return { name, type: "url" };
    }

    if (strings.every(isISODateTime)) {
      return { name, type: "date", includeTime: true };
    }

    if (strings.every(isISODate)) {
      return { name, type: "date" };
    }

    const isLong = strings.some(
      (s) => s.length > LONG_TEXT_THRESHOLD || s.includes("\n"),
    );
    return { name, type: isLong ? "long-text" : "text" };
  }

  // Array
  if (present.every((v) => Array.isArray(v))) {
    const allItems = (present as unknown[][]).flat();

    if (allItems.length === 0) {
      return { name, type: "array", itemFields: [] };
    }

    // Array of strings → multi-select (collect unique values as options)
    if (allItems.every((item) => typeof item === "string")) {
      const unique = [...new Set(allItems as string[])].slice(0, 50);
      const options: SelectOption[] = unique.map((v) => ({
        label: v,
        value: v,
      }));
      return { name, type: "multi-select", options };
    }

    // Array of objects → array field with inferred item shape
    if (
      allItems.every(
        (item) =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    ) {
      const itemFields = inferFields(
        allItems as Record<string, unknown>[],
      );
      return { name, type: "array", itemFields };
    }

    return { name, type: "array", itemFields: [] };
  }

  // Object
  if (
    present.every(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v),
    )
  ) {
    const fields = inferFields(present as Record<string, unknown>[]);
    return { name, type: "object", fields };
  }

  // Fallback
  return { name, type: "text" };
}

// ---------------------------------------------------------------------------
// Infer fields from a list of objects
// ---------------------------------------------------------------------------

function inferFields(rows: Record<string, unknown>[]): FieldDefinition[] {
  // Collect all keys seen across all rows
  const keySet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }

  const fields: FieldDefinition[] = [];

  for (const key of keySet) {
    const values = rows.map((row) => row[key]);
    fields.push(inferFieldDefinition(key, values));
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Infer a `CollectionSchema` from the data of a set of content entries.
 *
 * The result is a best-effort approximation — string fields that look like
 * emails, URLs, or ISO dates get the correct semantic type. Everything else
 * falls back to `text`.
 */
export function inferSchema(
  entries: ContentEntry[],
  collectionName: string,
): CollectionSchema {
  const rows = entries.map((e) => e.data as Record<string, unknown>);
  const fields = inferFields(rows);

  return {
    collection: collectionName,
    fields,
  };
}
