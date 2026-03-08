"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutList, X } from "lucide-react";

export function FormAddSection() {
  const addField = useEditorStore((s) => s.addField);
  const [isAdding, setIsAdding] = useState(false);
  const [sectionName, setSectionName] = useState("");

  function handleAdd() {
    const name = sectionName.trim();
    if (!name) return;
    addField("", name, {});
    setSectionName("");
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
        <LayoutList className="h-4 w-4" />
        Add section
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Section name"
        value={sectionName}
        onChange={(e) => setSectionName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setIsAdding(false);
        }}
        className="h-8 w-44"
        autoFocus
      />
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
