"use client";

/**
 * @context  UI editor — table cell at src/cli/ui/editors/json-sheet/sheet-cell.tsx
 * @does     Formats and displays a cell value with type-aware previews for arrays, objects, and primitives
 * @depends  none
 * @do       Add new value type formatters (e.g. date, color swatch) here
 * @dont     Put editable inputs here — editing happens in sheet-row-inspector.tsx
 */

interface Props {
  value: unknown;
}

function formatArrayPreview(arr: unknown[]): string {
  if (arr.length === 0) return "[]";
  if (arr.every((item) => typeof item !== "object" || item === null)) {
    const joined = arr.join(", ");
    return joined.length > 60 ? `${joined.slice(0, 57)}…` : joined;
  }
  return `${arr.length} item${arr.length !== 1 ? "s" : ""}`;
}

function formatObjectPreview(obj: object): string {
  const keys = Object.keys(obj);
  if (keys.length === 0) return "{}";
  if (keys.length <= 3) return `{ ${keys.join(", ")} }`;
  return `{ ${keys.slice(0, 2).join(", ")}, +${keys.length - 2} }`;
}

function truncateText(value: unknown): string {
  const str = String(value);
  if (str.length <= 100) return str;
  return `${str.slice(0, 97)}…`;
}

export function SheetCell({ value }: Props) {
  return (
    <span className="block truncate px-1 py-0.5">
      {value === null || value === undefined ? (
        <span className="text-muted-foreground">—</span>
      ) : typeof value === "boolean" ? (
        value ? "true" : "false"
      ) : value instanceof Date ? (
        truncateText(value.toISOString().split("T")[0])
      ) : Array.isArray(value) ? (
        <span className="text-muted-foreground">{formatArrayPreview(value)}</span>
      ) : typeof value === "object" ? (
        <span className="text-muted-foreground">{formatObjectPreview(value)}</span>
      ) : (
        truncateText(value)
      )}
    </span>
  );
}
