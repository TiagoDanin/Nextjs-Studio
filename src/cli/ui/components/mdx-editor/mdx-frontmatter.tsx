"use client";

import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function MdxFrontmatter() {
  const frontmatter = useMdxEditorStore((s) => s.frontmatter);
  const updateFrontmatter = useMdxEditorStore((s) => s.updateFrontmatter);

  return (
    <div className="border-b px-6 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Frontmatter
      </p>
      <div className="flex flex-col gap-3">
        {Object.entries(frontmatter).map(([key, value]) => (
          <FrontmatterField
            key={key}
            fieldKey={key}
            value={value}
            onChange={(v) => updateFrontmatter(key, v)}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldProps {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FrontmatterField({ fieldKey, value, onChange }: FieldProps) {
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {fieldKey}
        </Label>
        <Switch checked={value} onCheckedChange={onChange} />
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
          value={value.join(", ")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((s) => s.trim()))
          }
          placeholder="comma-separated"
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
        type={typeof value === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => {
          if (typeof value === "number") {
            const n = Number(e.target.value);
            onChange(Number.isNaN(n) ? 0 : n);
          } else {
            onChange(e.target.value);
          }
        }}
      />
    </div>
  );
}
