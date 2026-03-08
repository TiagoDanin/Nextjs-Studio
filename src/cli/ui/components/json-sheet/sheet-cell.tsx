"use client";

interface Props {
  value: unknown;
}

export function SheetCell({ value }: Props) {
  return (
    <span className="block truncate px-1 py-0.5">
      {value === null || value === undefined ? (
        <span className="text-muted-foreground">—</span>
      ) : typeof value === "boolean" ? (
        value ? "true" : "false"
      ) : (
        String(value)
      )}
    </span>
  );
}
