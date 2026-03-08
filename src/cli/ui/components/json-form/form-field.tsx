"use client";

import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { keyLabel } from "@shared/fields";
import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  StatusField,
} from "@shared/fields";

interface Props {
  fieldKey: string;
  path: string;
  value: unknown;
}

// Shared label + wrapper layout
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <Label className="w-36 shrink-0 pt-2 text-sm text-muted-foreground">
        {label}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Native <select> styled to match shadcn Input
function NativeSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FormField({ fieldKey, path, value }: Props) {
  const updateField = useEditorStore((s) => s.updateField);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);

  // fieldKey is the last segment of the path (works for nested fields too)
  const lastKey = path.split(".").at(-1) ?? fieldKey;
  const fieldDef: FieldDefinition | undefined = fieldDefs[lastKey];
  // label is pre-resolved by the server action; fall back to keyLabel for dynamic fields
  const label = fieldDef?.label ?? keyLabel(fieldKey);
  const type = fieldDef?.type;

  // --- boolean ---
  if (type === "boolean" || (!type && typeof value === "boolean")) {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {label}
        </Label>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => updateField(path, checked)}
        />
      </div>
    );
  }

  // --- number ---
  if (type === "number" || (!type && typeof value === "number")) {
    return (
      <FieldRow label={label}>
        <Input
          type="number"
          value={value as number}
          onChange={(e) => {
            const num = Number(e.target.value);
            updateField(path, Number.isNaN(num) ? 0 : num);
          }}
        />
      </FieldRow>
    );
  }

  // --- date / datetime ---
  if (type === "date") {
    const includeTime = (fieldDef as { includeTime?: boolean }).includeTime;
    return (
      <FieldRow label={label}>
        <Input
          type={includeTime ? "datetime-local" : "date"}
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
        />
      </FieldRow>
    );
  }

  // --- created-time / updated-time (read-only display) ---
  if (type === "created-time" || type === "updated-time") {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={String(value ?? "")}
          readOnly
          className="cursor-default opacity-60"
        />
      </FieldRow>
    );
  }

  // --- email ---
  if (type === "email") {
    return (
      <FieldRow label={label}>
        <Input
          type="email"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          placeholder={(fieldDef as { placeholder?: string }).placeholder}
        />
      </FieldRow>
    );
  }

  // --- url ---
  if (type === "url") {
    return (
      <FieldRow label={label}>
        <Input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          placeholder={(fieldDef as { placeholder?: string }).placeholder}
        />
      </FieldRow>
    );
  }

  // --- select ---
  if (type === "select") {
    const opts = (fieldDef as SelectField).options ?? [];
    return (
      <FieldRow label={label}>
        <NativeSelect
          value={String(value ?? "")}
          onChange={(v) => updateField(path, v)}
          options={[{ label: "—", value: "" }, ...opts]}
        />
      </FieldRow>
    );
  }

  // --- multi-select (comma-separated for now) ---
  if (type === "multi-select") {
    const opts = (fieldDef as MultiSelectField).options ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <FieldRow label={label}>
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== o.value)
                      : [...selected, o.value];
                    updateField(path, next);
                  }}
                  className="h-3.5 w-3.5 rounded border-input accent-foreground"
                />
                {o.label}
              </label>
            );
          })}
          {opts.length === 0 && (
            <Input
              type="text"
              value={selected.join(", ")}
              onChange={(e) =>
                updateField(
                  path,
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                )
              }
              placeholder="comma-separated values"
            />
          )}
        </div>
      </FieldRow>
    );
  }

  // --- status ---
  if (type === "status") {
    const opts = (fieldDef as StatusField).options ?? [];
    return (
      <FieldRow label={label}>
        <NativeSelect
          value={String(value ?? "")}
          onChange={(v) => updateField(path, v)}
          options={[{ label: "—", value: "" }, ...opts]}
        />
      </FieldRow>
    );
  }

  // --- long-text ---
  if (type === "long-text") {
    const rows = (fieldDef as { rows?: number }).rows ?? 3;
    return (
      <FieldRow label={label}>
        <textarea
          rows={rows}
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          placeholder={(fieldDef as { placeholder?: string }).placeholder}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FieldRow>
    );
  }

  // --- media ---
  if (type === "media") {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          placeholder="Media path or URL"
        />
      </FieldRow>
    );
  }

  // --- id / slug (editable text) ---
  if (type === "id" || type === "slug") {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
        />
      </FieldRow>
    );
  }

  // --- array fallback (comma-separated) ---
  if (type === "array" || Array.isArray(value)) {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={Array.isArray(value) ? (value as unknown[]).join(", ") : String(value ?? "")}
          onChange={(e) => {
            const arr = e.target.value.split(",").map((s) => s.trim());
            updateField(path, arr);
          }}
          placeholder="comma-separated values"
        />
      </FieldRow>
    );
  }

  // --- default: text ---
  return (
    <FieldRow label={label}>
      <Input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => updateField(path, e.target.value)}
        placeholder={(fieldDef as { placeholder?: string } | undefined)?.placeholder}
      />
    </FieldRow>
  );
}
