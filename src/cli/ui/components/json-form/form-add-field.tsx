"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const typeDefaults: Record<string, unknown> = {
  string: "",
  number: 0,
  boolean: false,
};

interface Props {
  /** The section path to add the field into. Empty string = General (top-level). */
  path?: string;
}

export function FormAddField({ path = "" }: Props) {
  const addField = useEditorStore((s) => s.addField);
  const [isAdding, setIsAdding] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("string");

  function handleAdd() {
    if (!fieldName.trim()) return;
    addField(path, fieldName.trim(), typeDefaults[fieldType] ?? "");
    setFieldName("");
    setFieldType("string");
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className={cn(
          "flex w-fit items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5",
          "text-xs text-muted-foreground transition-colors",
          "hover:border-foreground/30 hover:text-foreground",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Add field
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Field name"
        value={fieldName}
        onChange={(e) => setFieldName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setIsAdding(false);
        }}
        className="h-8 w-44"
        autoFocus
      />
      <select
        value={fieldType}
        onChange={(e) => setFieldType(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
      </select>
      <button
        type="button"
        onClick={handleAdd}
        className="h-8 rounded-md border px-3 text-xs hover:bg-accent"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setIsAdding(false)}
        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
