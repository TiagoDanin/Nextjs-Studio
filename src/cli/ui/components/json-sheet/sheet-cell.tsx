"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Props {
  value: unknown;
  rowIndex: number;
  column: string;
}

function coerceValue(original: unknown, newValue: string): unknown {
  if (typeof original === "number") {
    const num = Number(newValue);
    return Number.isNaN(num) ? newValue : num;
  }
  if (typeof original === "boolean") {
    return newValue === "true";
  }
  return newValue;
}

export function SheetCell({ value, rowIndex, column }: Props) {
  const updateCell = useEditorStore((s) => s.updateCell);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (typeof value === "boolean") {
    return (
      <Switch
        checked={value}
        onCheckedChange={(checked) => updateCell(rowIndex, column, checked)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={typeof value === "number" ? "number" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          updateCell(rowIndex, column, coerceValue(value, editValue));
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateCell(rowIndex, column, coerceValue(value, editValue));
            setIsEditing(false);
          }
          if (e.key === "Escape") {
            setIsEditing(false);
          }
        }}
        className="h-7 text-sm"
      />
    );
  }

  return (
    <span
      className="block cursor-text truncate px-1 py-0.5"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditValue(String(value ?? ""));
        setIsEditing(true);
      }}
    >
      {value === null || value === undefined ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        String(value)
      )}
    </span>
  );
}
