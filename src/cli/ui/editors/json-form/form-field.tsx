"use client";

/**
 * @context  UI editor — form field renderer at src/cli/ui/editors/json-form/form-field.tsx
 * @does     Renders the appropriate input control for each field type in the JSON form editor
 * @depends  @/stores/editor-store, @/components/ui/*, @shared/fields, @shared/field-utils
 * @do       Add new field type renderers (e.g. color picker, relation) here
 * @dont     Put form-level layout or section logic here — that belongs in form-section.tsx
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/native-select";
import { keyLabel } from "@shared/field-utils";
import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  StatusField,
} from "@shared/fields";

const RichTextField = dynamic(() => import("./rich-text-field").then((m) => m.RichTextField), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse rounded-md border bg-muted/30" />,
});

interface Props {
  fieldKey: string;
  path: string;
  value: unknown;
  isRichText?: boolean;
}

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

export function FormField({ fieldKey, path, value, isRichText }: Props) {
  const updateField = useEditorStore((s) => s.updateField);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);

  // fieldKey is the last segment of the path (works for nested fields too)
  const lastKey = path.split(".").at(-1) ?? fieldKey;
  const fieldDef: FieldDefinition | undefined = fieldDefs[lastKey];
  // label is pre-resolved by the server action; fall back to keyLabel for dynamic fields
  const label = fieldDef?.label ?? keyLabel(fieldKey);
  const type = fieldDef?.type;

  if (isRichText && typeof value === "string") {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <RichTextField
          value={value}
          onChange={(md) => updateField(path, md)}
          placeholder="Start writing..."
        />
      </div>
    );
  }

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

  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    type !== "array"
  ) {
    return (
      <NestedObjectField
        label={label}
        path={path}
        entries={Object.entries(value as Record<string, unknown>)}
      />
    );
  }

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

function NestedObjectField({
  label,
  path,
  entries,
}: {
  label: string;
  path: string;
  entries: [string, unknown][];
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 py-1">
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            isOpen && "rotate-90",
          )}
        />
        <Label className="cursor-pointer text-sm text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">
          ({entries.length} field{entries.length !== 1 ? "s" : ""})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 flex flex-col gap-3 border-l pl-4 pt-2">
          {entries.map(([key, val]) => (
            <FormField
              key={key}
              fieldKey={key}
              path={`${path}.${key}`}
              value={val}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
