"use client";

import { useEditorStore } from "@/stores/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  fieldKey: string;
  path: string;
  value: unknown;
}

export function FormField({ fieldKey, path, value }: Props) {
  const updateField = useEditorStore((s) => s.updateField);

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {fieldKey}
        </Label>
        <Switch
          checked={value}
          onCheckedChange={(checked) => updateField(path, checked)}
        />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {fieldKey}
        </Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const num = Number(e.target.value);
            updateField(path, Number.isNaN(num) ? 0 : num);
          }}
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {fieldKey}
        </Label>
        <Input
          type="text"
          value={value.join(", ")}
          onChange={(e) => {
            const arr = e.target.value.split(",").map((s) => s.trim());
            updateField(path, arr);
          }}
          placeholder="comma-separated values"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Label className="w-36 shrink-0 text-sm text-muted-foreground">
        {fieldKey}
      </Label>
      <Input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => updateField(path, e.target.value)}
      />
    </div>
  );
}
