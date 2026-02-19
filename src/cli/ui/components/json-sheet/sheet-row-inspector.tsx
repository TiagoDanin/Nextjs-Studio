"use client";

import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

function coerceValue(original: unknown, newValue: string): unknown {
  if (typeof original === "number") {
    const num = Number(newValue);
    return Number.isNaN(num) ? newValue : num;
  }
  return newValue;
}

export function SheetRowInspector() {
  const selectedRowIndex = useEditorStore((s) => s.selectedRowIndex);
  const rows = useEditorStore((s) => s.rows);
  const updateCell = useEditorStore((s) => s.updateCell);
  const selectRow = useEditorStore((s) => s.selectRow);

  if (selectedRowIndex === null || !rows[selectedRowIndex]) return null;

  const row = rows[selectedRowIndex];
  const entries = Object.entries(row);

  return (
    <div className="shrink-0 border-t">
      <div className="flex h-10 items-center justify-between border-b px-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Row Inspector — Row {selectedRowIndex + 1}
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
      <div className="flex flex-wrap gap-x-6 gap-y-3 overflow-auto px-4 py-3" style={{ maxHeight: "180px" }}>
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <Label className="w-24 shrink-0 truncate text-xs text-muted-foreground">
              {key}
            </Label>
            {typeof value === "boolean" ? (
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  updateCell(selectedRowIndex, key, checked)
                }
              />
            ) : (
              <Input
                type={typeof value === "number" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) =>
                  updateCell(
                    selectedRowIndex,
                    key,
                    coerceValue(value, e.target.value),
                  )
                }
                className="h-7 w-40 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
