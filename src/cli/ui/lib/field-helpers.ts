/**
 * @context  UI lib — field helpers at src/cli/ui/lib/field-helpers.ts
 * @does     Shared pure utilities for field rendering across all editors
 * @depends  @shared/fields for FieldDefinition type
 * @do       Add new field-related utilities here
 * @dont     Import React or UI components — this is logic only
 */

import { nanoid } from "nanoid";
import type { FieldDefinition, IdField, DateField } from "@shared/fields";

/**
 * Client-side slugify (cannot use @sindresorhus/slugify — it's in serverExternalPackages).
 * Converts text to URL-safe slug: lowercase, spaces/special → dashes, no duplicates.
 */
export function clientSlugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/**
 * Format an ISO timestamp string to a human-readable locale string.
 * Returns the raw value as-is if parsing fails.
 */
export function formatTimestamp(iso: string): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return iso;
  }
}

/**
 * Evaluate a formula expression against a data context.
 * Uses `new Function` with the data keys as local variables.
 * Returns string result or empty string on error.
 */
export function evaluateFormula(
  expression: string,
  data: Record<string, unknown>,
): string {
  if (!expression) return "";
  try {
    const keys = Object.keys(data);
    const values = keys.map((k) => data[k]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return (${expression})`);
    const result = fn(...values);
    return result == null ? "" : String(result);
  } catch {
    return "";
  }
}

/**
 * Resolve the default value for a field definition.
 * Uses `field.defaultValue` if defined, otherwise returns a type-appropriate zero value.
 */
export function resolveDefault(field: FieldDefinition): unknown {
  if ("defaultValue" in field && field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "multi-select":
    case "array":
      return [];
    case "object":
      return {};
    case "created-time":
    case "updated-time":
      return "";
    default:
      return "";
  }
}

/**
 * Generate a client-side ID.
 */
export function generateId(strategy?: IdField["generate"]): string {
  switch (strategy) {
    case "uuid":
      return crypto.randomUUID();
    case "cuid": {
      const ts = Date.now().toString(36);
      const rand = Math.random().toString(36).slice(2, 10);
      return `c${ts}${rand}`;
    }
    case "nanoid":
    default:
      return nanoid();
  }
}

/**
 * Resolve the HTML input type for a DateField based on includeTime/includeDay/includeMonth.
 *
 * - `includeTime: true` → "datetime-local"
 * - `includeDay: false, includeMonth: false` → "year" (rendered as number input, 4 digits)
 * - `includeDay: false` → "month" (month/year picker)
 * - default → "date"
 */
export function getDateInputType(field: DateField): "datetime-local" | "date" | "month" | "year" {
  if (field.includeTime) return "datetime-local";
  if (field.includeDay === false) {
    if (field.includeMonth === false) return "year";
    return "month";
  }
  return "date";
}

/**
 * Check if a media path points to an image based on extension.
 */
export function isImagePath(path: string): boolean {
  if (!path) return false;
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext);
}
