"use client";

/**
 * @context  UI editor — frontmatter panel at src/cli/ui/editors/mdx-editor/mdx-frontmatter.tsx
 * @does     Renders key-value fields for editing MDX frontmatter (title, date, tags, etc.)
 * @depends  @/stores/mdx-editor-store, @/components/ui/input, @/components/ui/label, @/components/ui/switch
 * @do       Add new frontmatter field types (e.g. date picker, select) here
 * @dont     Parse or validate frontmatter — that belongs in core parsers
 */

import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function MdxFrontmatter() {
  const frontmatter = useMdxEditorStore((s) => s.frontmatter);
  const updateFrontmatter = useMdxEditorStore((s) => s.updateFrontmatter);

  return (
    <div className="border-b bg-muted/20 px-6 py-4">
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

const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const DATE_FIELD_NAMES = ["date", "publishedAt", "createdAt", "updatedAt", "published_at", "created_at", "updated_at"];

function isDateValue(key: string, value: unknown): "date" | "datetime" | false {
  if (typeof value !== "string") return false;
  if (RE_ISO_DATETIME.test(value) && !RE_ISO_DATE.test(value)) return "datetime";
  if (RE_ISO_DATE.test(value)) return "date";
  if (DATE_FIELD_NAMES.includes(key)) return "date";
  return false;
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

  const dateType = isDateValue(fieldKey, value);
  if (dateType) {
    return (
      <div className="flex items-center gap-4">
        <Label className="w-36 shrink-0 text-sm text-muted-foreground">
          {fieldKey}
        </Label>
        <Input
          type={dateType === "datetime" ? "datetime-local" : "date"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
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
