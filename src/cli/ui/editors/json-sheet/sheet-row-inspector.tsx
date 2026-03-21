"use client";

/**
 * @context  UI editor — row detail panel at src/cli/ui/editors/json-sheet/sheet-row-inspector.tsx
 * @does     Renders an inline editing panel for all fields of a selected table row
 * @depends  @/stores/editor-store, @/components/ui/*, @shared/fields, @shared/field-utils
 * @do       Add new field type editors matching those in form-field.tsx
 * @dont     Put table structure or column definitions here — that belongs in sheet-table.tsx
 */

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/stores/editor-store";
import { useMediaStore } from "@/stores/media-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Pencil, Trash2, ImageIcon, Plus } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { keyLabel } from "@shared/field-utils";
import {
  clientSlugify,
  formatTimestamp,
  evaluateFormula,
  generateId,
  isImagePath,
  getDateInputType,
} from "@/lib/field-helpers";

const RichTextField = dynamic(
  () => import("../json-form/rich-text-field").then((m) => m.RichTextField),
  { ssr: false, loading: () => <div className="h-[120px] animate-pulse rounded-md border bg-muted/30" /> },
);
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

interface Props {
  rowIndex: number;
}

export function SheetRowInspector({ rowIndex }: Props) {
  const router = useRouter();
  const rows = useEditorStore((s) => s.rows);
  const updateCell = useEditorStore((s) => s.updateCell);
  const selectRow = useEditorStore((s) => s.selectRow);
  const deleteRow = useEditorStore((s) => s.deleteRow);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);
  const isMdx = useEditorStore((s) => s.isMdx);
  const collectionName = useEditorStore((s) => s.collectionName);
  const rowSlugs = useEditorStore((s) => s.rowSlugs);

  if (!rows[rowIndex]) return null;

  const row = rows[rowIndex];

  // Render fields in schema order first, then extras
  const fieldDefEntries = Object.entries(fieldDefs);
  const schemaKeys = new Set(fieldDefEntries.map(([k]) => k));
  const extraKeys = Object.keys(row).filter((k) => !schemaKeys.has(k));

  // Build ordered entries: schema fields first, then extras
  const orderedEntries: [string, unknown][] = [
    ...fieldDefEntries.map(([k]) => [k, row[k]] as [string, unknown]),
    ...extraKeys.map((k) => [k, row[k]] as [string, unknown]),
  ];

  function renderCell(key: string, value: unknown) {
    const fieldDef: FieldDefinition | undefined = fieldDefs[key];
    const type = fieldDef?.type;
    const label = fieldDef?.label ?? keyLabel(key);

    if (type === "boolean" || (!type && typeof value === "boolean")) {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateCell(rowIndex, key, checked)}
          />
        </div>
      );
    }

    if (type === "date") {
      const dateType = getDateInputType(fieldDef as import("@shared/fields").DateField);
      if (dateType === "year") {
        return (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
              {label}
            </Label>
            <Input
              type="number"
              min={1900}
              max={2100}
              value={String(value ?? "")}
              onChange={(e) => updateCell(rowIndex, key, e.target.value)}
              className="h-7 flex-1 text-sm"
              placeholder="YYYY"
            />
          </div>
        );
      }
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type={dateType}
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            className="h-7 flex-1 text-sm"
          />
        </div>
      );
    }

    if (type === "created-time" || type === "updated-time") {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="text"
            value={value ? formatTimestamp(String(value)) : ""}
            readOnly
            className="h-7 flex-1 cursor-default text-sm opacity-60"
            title={String(value ?? "")}
          />
        </div>
      );
    }

    if (type === "formula") {
      const expr = (fieldDef as FormulaField).expression;
      const result = evaluateFormula(expr, row);
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="text"
            value={result}
            readOnly
            className="h-7 flex-1 cursor-default text-sm opacity-60"
          />
        </div>
      );
    }

    if (type === "id") {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <IdCellInput
            value={value}
            fieldDef={fieldDef as IdField}
            onChange={(v) => updateCell(rowIndex, key, v)}
          />
        </div>
      );
    }

    if (type === "slug") {
      const fromField = (fieldDef as SlugField).from;
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            onBlur={(e) => {
              const raw = e.target.value;
              if (raw) {
                updateCell(rowIndex, key, clientSlugify(raw));
              } else if (fromField && row[fromField]) {
                updateCell(rowIndex, key, clientSlugify(String(row[fromField])));
              }
            }}
            className="h-7 flex-1 text-sm"
            placeholder={fromField ? `From "${fromField}"` : "slug"}
          />
        </div>
      );
    }

    if (type === "email") {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="email"
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            className="h-7 flex-1 text-sm"
          />
        </div>
      );
    }

    if (type === "url") {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="url"
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            className="h-7 flex-1 text-sm"
          />
        </div>
      );
    }

    if (type === "media") {
      const mediaVal = String(value ?? "");
      return (
        <div key={key} className="flex items-start gap-3">
          <Label className="w-36 shrink-0 truncate pt-1 text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={mediaVal}
                onChange={(e) => updateCell(rowIndex, key, e.target.value)}
                className="h-7 flex-1 text-sm"
                placeholder="Media path or URL"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  useMediaStore.getState().openPicker("any", (url) => {
                    updateCell(rowIndex, key, url);
                  }, collectionName);
                }}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            {mediaVal && isImagePath(mediaVal) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaVal}
                alt=""
                className="h-8 w-8 rounded border object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
        </div>
      );
    }

    if (type === "select") {
      const opts = (fieldDef as SelectField).options ?? [];
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <NativeSelect
            value={String(value ?? "")}
            onChange={(v) => updateCell(rowIndex, key, v)}
            options={[{ label: "—", value: "" }, ...opts]}
            className="h-7 flex-1 px-2"
          />
        </div>
      );
    }

    if (type === "status") {
      const opts = (fieldDef as StatusField).options ?? [];
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <NativeSelect
            value={String(value ?? "")}
            onChange={(v) => updateCell(rowIndex, key, v)}
            options={[{ label: "—", value: "" }, ...opts]}
            className="h-7 flex-1 px-2"
          />
        </div>
      );
    }

    if (type === "multi-select") {
      const opts = (fieldDef as MultiSelectField).options ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div key={key} className="flex items-start gap-3">
          <Label className="w-36 shrink-0 truncate pt-1 text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((v) => v !== o.value)
                        : [...selected, o.value];
                      updateCell(rowIndex, key, next);
                    }}
                    className="h-3 w-3 rounded border-input accent-foreground"
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
                  updateCell(
                    rowIndex,
                    key,
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  )
                }
                className="h-7 flex-1 text-sm"
              />
            )}
          </div>
        </div>
      );
    }

    if (type === "number" || (!type && typeof value === "number")) {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="number"
            value={String(value ?? 0)}
            onChange={(e) => {
              const num = Number(e.target.value);
              updateCell(rowIndex, key, Number.isNaN(num) ? 0 : num);
            }}
            className="h-7 flex-1 text-sm"
          />
        </div>
      );
    }

    if (type === "long-text") {
      return (
        <div key={key} className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <RichTextField
            value={String(value ?? "")}
            onChange={(md) => updateCell(rowIndex, key, md)}
            placeholder="Start writing..."
          />
        </div>
      );
    }

    if (type === "relation") {
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            className="h-7 flex-1 text-sm"
            placeholder={`Slug from "${(fieldDef as { collection: string }).collection}"`}
          />
        </div>
      );
    }

    if (type === "array") {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      const itemFields = (fieldDef as ArrayField).itemFields;

      if (itemFields.length === 0 || (itemFields.length === 1 && itemFields[0]?.type === "text")) {
        const flat = items.map((item) => typeof item === "string" ? item : String(item));
        return (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
              {label}
            </Label>
            <Input
              type="text"
              value={flat.join(", ")}
              onChange={(e) => updateCell(rowIndex, key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="h-7 flex-1 text-sm"
              placeholder="comma-separated"
            />
          </div>
        );
      }

      // Complex arrays
      return (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                const empty: Record<string, unknown> = {};
                for (const f of itemFields) empty[f.name] = "";
                updateCell(rowIndex, key, [...items, empty]);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-l pl-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 rounded border bg-muted/10 p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const next = items.filter((_, i) => i !== idx);
                      updateCell(rowIndex, key, next);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {itemFields.map((itemField) => {
                  const ifValue = typeof item === "object" && item !== null ? (item as Record<string, unknown>)[itemField.name] : "";
                  const ifLabel = ("label" in itemField && itemField.label) ? String(itemField.label) : keyLabel(itemField.name);
                  return (
                    <div key={itemField.name} className="flex items-center gap-2">
                      <Label className="w-20 shrink-0 truncate text-[10px] text-muted-foreground">{ifLabel}</Label>
                      <Input
                        type={itemField.type === "url" ? "url" : itemField.type === "email" ? "email" : itemField.type === "number" ? "number" : "text"}
                        value={String(ifValue ?? "")}
                        onChange={(e) => {
                          const newItem = { ...(item as Record<string, unknown>), [itemField.name]: itemField.type === "number" ? Number(e.target.value) || 0 : e.target.value };
                          const next = [...items];
                          next[idx] = newItem;
                          updateCell(rowIndex, key, next);
                        }}
                        className="h-6 flex-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      const items = value as unknown[];
      const allPrimitive = items.every((v) => typeof v !== "object" || v === null);
      if (allPrimitive) {
        return (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
              {label}
            </Label>
            <Input
              type="text"
              value={items.join(", ")}
              onChange={(e) =>
                updateCell(
                  rowIndex,
                  key,
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                )
              }
              className="h-7 flex-1 text-sm"
            />
          </div>
        );
      }
      return (
        <div key={key} className="flex items-start gap-3">
          <Label className="w-36 shrink-0 truncate pt-1 text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <pre className="max-h-32 flex-1 overflow-auto rounded border bg-muted/50 px-2 py-1 text-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div key={key} className="flex items-start gap-3">
          <Label className="w-36 shrink-0 truncate pt-1 text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <div className="flex flex-1 flex-col gap-1.5 border-l pl-3">
            {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => {
              if (typeof subVal === "object" && subVal !== null) {
                return (
                  <div key={subKey} className="flex items-start gap-2">
                    <Label className="w-24 shrink-0 truncate pt-1 text-xs text-muted-foreground">
                      {keyLabel(subKey)}
                    </Label>
                    <pre className="max-h-24 flex-1 overflow-auto rounded border bg-muted/50 px-2 py-1 text-xs">
                      {JSON.stringify(subVal, null, 2)}
                    </pre>
                  </div>
                );
              }
              return (
                <div key={subKey} className="flex items-center gap-2">
                  <Label className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                    {keyLabel(subKey)}
                  </Label>
                  {typeof subVal === "boolean" ? (
                    <Switch
                      checked={subVal}
                      onCheckedChange={(checked) => {
                        const updated = { ...(value as Record<string, unknown>), [subKey]: checked };
                        updateCell(rowIndex, key, updated);
                      }}
                    />
                  ) : typeof subVal === "number" ? (
                    <Input
                      type="number"
                      value={String(subVal)}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        const updated = { ...(value as Record<string, unknown>), [subKey]: Number.isNaN(num) ? 0 : num };
                        updateCell(rowIndex, key, updated);
                      }}
                      className="h-6 w-32 text-xs"
                    />
                  ) : (
                    <Input
                      type="text"
                      value={String(subVal ?? "")}
                      onChange={(e) => {
                        const updated = { ...(value as Record<string, unknown>), [subKey]: e.target.value };
                        updateCell(rowIndex, key, updated);
                      }}
                      className="h-6 w-32 text-xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (typeof value === "string" && (type === "long-text" || value.length > 200 || value.includes("\n"))) {
      return (
        <div key={key} className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <RichTextField
            value={value}
            onChange={(md) => updateCell(rowIndex, key, md)}
            placeholder="Start writing..."
          />
        </div>
      );
    }

    return (
      <div key={key} className="flex items-center gap-3">
        <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
          {label}
        </Label>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateCell(rowIndex, key, e.target.value)}
          className="h-7 flex-1 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="border-l-2 border-l-foreground/20 bg-muted/40">
      <div className="flex h-10 items-center justify-between border-b px-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/80">
          Row details - {rowIndex + 1}
        </h3>
        <div className="flex items-center gap-0.5">
          {isMdx && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit entry"
              onClick={() => router.push(`/collection/${collectionName}/${rowSlugs[rowIndex] ?? ""}`)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Delete row"
            onClick={() => { deleteRow(rowIndex); selectRow(null); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectRow(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex max-h-80 flex-col gap-2 overflow-auto px-4 py-3">
        {orderedEntries.map(([key, value]) => renderCell(key, value))}
      </div>
    </div>
  );
}

/** ID cell: read-only, auto-generates if empty */
function IdCellInput({
  value,
  fieldDef,
  onChange,
}: {
  value: unknown;
  fieldDef: IdField;
  onChange: (v: unknown) => void;
}) {
  const generated = useRef(false);
  useEffect(() => {
    if (!value && !generated.current) {
      generated.current = true;
      onChange(generateId(fieldDef.generate));
    }
  }, [value, fieldDef.generate, onChange]);

  return (
    <Input type="text" value={String(value ?? "")} readOnly className="h-7 flex-1 cursor-default text-sm opacity-60" />
  );
}
