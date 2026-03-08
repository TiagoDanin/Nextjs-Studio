/**
 * @context  Shared layer — field label utilities at src/shared/field-utils.ts
 * @does     Resolves human-readable labels for field definitions and raw key strings
 * @depends  src/shared/fields.ts
 * @do       Add field-related utility functions here
 * @dont     Import from CLI or UI; contain field type definitions or schema logic
 */

import type { BaseField } from "./fields.js";

/**
 * Resolve the human-readable label for a field.
 *
 * When the field definition has an explicit `label`, that is returned as-is.
 * Otherwise the `name` (camelCase / kebab-case / snake_case) is converted to Title Case:
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
