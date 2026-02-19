"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

const typeDefaults: Record<string, unknown> = {
  string: "",
  number: 0,
  boolean: false,
};

export function FormAddField() {
  const addField = useEditorStore((s) => s.addField);
  const [isAdding, setIsAdding] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("string");

  function handleAdd() {
    if (!fieldName.trim()) return;
    addField("", fieldName.trim(), typeDefaults[fieldType] ?? "");
    setFieldName("");
    setFieldType("string");
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4" />
        Add field
      </Button>
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
        className="h-8 w-48"
        autoFocus
      />
      <select
        value={fieldType}
        onChange={(e) => setFieldType(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
      </select>
      <Button size="sm" variant="outline" className="h-8" onClick={handleAdd}>
        Add
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => setIsAdding(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
