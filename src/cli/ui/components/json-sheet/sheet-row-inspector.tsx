"use client";

import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function coerceValue(original: unknown, newValue: string): unknown {
  if (typeof original === "number") {
    const num = Number(newValue);
    return Number.isNaN(num) ? newValue : num;
  }
  return newValue;
}

interface Props {
  rowIndex: number;
}

export function SheetRowInspector({ rowIndex }: Props) {
  const rows = useEditorStore((s) => s.rows);
  const updateCell = useEditorStore((s) => s.updateCell);
  const selectRow = useEditorStore((s) => s.selectRow);

  if (!rows[rowIndex]) return null;

  const row = rows[rowIndex];
  const entries = Object.entries(row);

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
      <div className="flex max-h-[320px] flex-col gap-2 overflow-auto px-4 py-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-36 shrink-0 truncate text-xs font-semibold text-muted-foreground">
              {key}
            </Label>
            {typeof value === "boolean" ? (
              <Switch
                checked={value}
                onCheckedChange={(checked) => updateCell(rowIndex, key, checked)}
              />
            ) : (
              <Input
                type={typeof value === "number" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) =>
                  updateCell(rowIndex, key, coerceValue(value, e.target.value))
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
