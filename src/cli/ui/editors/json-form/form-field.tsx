"use client";

/**
 * @context  UI editor — form field renderer at src/cli/ui/editors/json-form/form-field.tsx
 * @does     Renders the appropriate input control for each field type in the JSON form editor
 * @depends  @/stores/editor-store, @/components/ui/*, @shared/fields, @shared/field-utils
 * @do       Add new field type renderers (e.g. color picker, relation) here
 * @dont     Put form-level layout or section logic here — that belongs in form-section.tsx
 */

import { memo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor-store";
import { useMediaStore } from "@/stores/media-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { keyLabel } from "@shared/field-utils";
import { TreeNode } from "./tree-node";
import {
  clientSlugify,
  formatTimestamp,
  evaluateFormula,
  generateId,
  isImagePath,
  getDateInputType,
} from "@/lib/field-helpers";
import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  StatusField,
  SlugField,
  IdField,
  FormulaField,
  ArrayField,
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

export const FormField = memo(function FormField({ fieldKey, path, value, isRichText }: Props) {
  const updateField = useEditorStore((s) => s.updateField);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);
  const formData = useEditorStore((s) => s.formData);
  const collectionName = useEditorStore((s) => s.collectionName);

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
    const dateType = getDateInputType(fieldDef as import("@shared/fields").DateField);
    if (dateType === "year") {
      return (
        <FieldRow label={label}>
          <Input
            type="number"
            min={1900}
            max={2100}
            value={String(value ?? "")}
            onChange={(e) => updateField(path, e.target.value)}
            placeholder="YYYY"
          />
        </FieldRow>
      );
    }
    return (
      <FieldRow label={label}>
        <Input
          type={dateType}
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
          value={value ? formatTimestamp(String(value)) : ""}
          readOnly
          className="cursor-default opacity-60"
          title={String(value ?? "")}
        />
      </FieldRow>
    );
  }

  if (type === "formula") {
    const expr = (fieldDef as FormulaField).expression;
    const result = evaluateFormula(expr, formData);
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={result}
          readOnly
          className="cursor-default opacity-60"
        />
      </FieldRow>
    );
  }

  if (type === "id") {
    return (
      <FieldRow label={label}>
        <IdFieldInput value={value} fieldDef={fieldDef as IdField} updateField={(v) => updateField(path, v)} />
      </FieldRow>
    );
  }

  if (type === "slug") {
    const fromField = (fieldDef as SlugField).from;
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          onBlur={(e) => {
            const raw = e.target.value;
            if (raw) {
              updateField(path, clientSlugify(raw));
            } else if (fromField && formData[fromField]) {
              updateField(path, clientSlugify(String(formData[fromField])));
            }
          }}
          placeholder={fromField ? `Generated from "${fromField}"` : "slug"}
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
    const mediaVal = String(value ?? "");
    return (
      <FieldRow label={label}>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={mediaVal}
            onChange={(e) => updateField(path, e.target.value)}
            placeholder="Media path or URL"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            title="Pick media"
            onClick={() => {
              useMediaStore.getState().openPicker("any", (url) => {
                updateField(path, url);
              }, collectionName);
            }}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
        {mediaVal && isImagePath(mediaVal) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaVal.startsWith("http") ? mediaVal : `/api/public/${collectionName}/media/${mediaVal.replace(/^\//, "")}`}
            alt=""
            className="mt-1 h-10 w-10 rounded border object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
      </FieldRow>
    );
  }

  if (type === "relation") {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateField(path, e.target.value)}
          placeholder={`Slug from "${(fieldDef as { collection: string }).collection}"`}
        />
      </FieldRow>
    );
  }

  if (type === "array") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const itemFields = (fieldDef as ArrayField).itemFields;

    // Simple string arrays
    if (itemFields.length === 0 || (itemFields.length === 1 && itemFields[0]?.type === "text")) {
      return (
        <FieldRow label={label}>
          <Input
            type="text"
            value={items.map((item) => typeof item === "string" ? item : String(item)).join(", ")}
            onChange={(e) => updateField(path, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="comma-separated values"
          />
        </FieldRow>
      );
    }

    // Complex arrays: inline editable
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-sm text-muted-foreground">{label}</Label>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-6 w-6"
            title="Add item"
            onClick={() => {
              const empty: Record<string, unknown> = {};
              for (const f of itemFields) empty[f.name] = "";
              updateField(path, [...items, empty]);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="ml-4 flex flex-col gap-3 border-l pl-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded border bg-muted/10 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const next = items.filter((_, i) => i !== idx);
                    updateField(path, next);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {itemFields.map((itemField) => {
                const ifLabel = ("label" in itemField && itemField.label) ? String(itemField.label) : keyLabel(itemField.name);
                const ifValue = typeof item === "object" && item !== null ? (item as Record<string, unknown>)[itemField.name] : "";
                return (
                  <FieldRow key={itemField.name} label={ifLabel}>
                    <Input
                      type={itemField.type === "url" ? "url" : itemField.type === "email" ? "email" : itemField.type === "number" ? "number" : "text"}
                      value={String(ifValue ?? "")}
                      onChange={(e) => {
                        const newItem = { ...(item as Record<string, unknown>), [itemField.name]: itemField.type === "number" ? Number(e.target.value) || 0 : e.target.value };
                        const next = [...items];
                        next[idx] = newItem;
                        updateField(path, next);
                      }}
                    />
                  </FieldRow>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return (
      <TreeNode
        label={label}
        path={path}
        data={value as Record<string, unknown>}
      />
    );
  }

  if (Array.isArray(value)) {
    return (
      <FieldRow label={label}>
        <Input
          type="text"
          value={(value as unknown[]).join(", ")}
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
});

/** ID field: read-only, auto-generates if empty */
function IdFieldInput({
  value,
  fieldDef,
  updateField,
}: {
  value: unknown;
  fieldDef: IdField;
  updateField: (v: unknown) => void;
}) {
  const generated = useRef(false);
  useEffect(() => {
    if (!value && !generated.current) {
      generated.current = true;
      updateField(generateId(fieldDef.generate));
    }
  }, [value, fieldDef.generate, updateField]);

  return (
    <Input type="text" value={String(value ?? "")} readOnly className="cursor-default opacity-60" />
  );
}
