"use client";

/**
 * @context  UI editor — row detail panel at src/cli/ui/editors/json-sheet/sheet-row-inspector.tsx
 * @does     Renders an inline editing panel for all fields of a selected table row
 * @depends  @/stores/editor-store, @/components/ui/*, @shared/fields, @shared/field-utils
 * @do       Add new field type editors matching those in form-field.tsx
 * @dont     Put table structure or column definitions here — that belongs in sheet-table.tsx
 */

import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { keyLabel } from "@shared/field-utils";
import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  StatusField,
} from "@shared/fields";

interface Props {
  rowIndex: number;
}

export function SheetRowInspector({ rowIndex }: Props) {
  const rows = useEditorStore((s) => s.rows);
  const updateCell = useEditorStore((s) => s.updateCell);
  const selectRow = useEditorStore((s) => s.selectRow);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);

  if (!rows[rowIndex]) return null;

  const row = rows[rowIndex];
  const entries = Object.entries(row);

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
      const includeTime = (fieldDef as { includeTime?: boolean }).includeTime;
      return (
        <div key={key} className="flex items-center gap-3">
          <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
            {label}
          </Label>
          <Input
            type={includeTime ? "datetime-local" : "date"}
            value={String(value ?? "")}
            onChange={(e) => updateCell(rowIndex, key, e.target.value)}
            className="h-7 w-40 text-sm"
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
            value={String(value ?? "")}
            readOnly
            className="h-7 w-40 cursor-default text-sm opacity-60"
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
            className="h-7 w-40 text-sm"
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
            className="h-7 w-40 text-sm"
          />
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
            className="h-7 w-40 px-2"
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
            className="h-7 w-40 px-2"
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
                className="h-7 w-40 text-sm"
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
            className="h-7 w-40 text-sm"
          />
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
              className="h-7 w-40 text-sm"
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

    return (
      <div key={key} className="flex items-center gap-3">
        <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
          {label}
        </Label>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateCell(rowIndex, key, e.target.value)}
          className="h-7 w-40 text-sm"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => selectRow(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex max-h-80 flex-col gap-2 overflow-auto px-4 py-3">
        {entries.map(([key, value]) => renderCell(key, value))}
      </div>
    </div>
  );
}
