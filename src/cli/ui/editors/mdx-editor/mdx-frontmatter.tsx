"use client";

/**
 * @context  UI editor — frontmatter panel at src/cli/ui/editors/mdx-editor/mdx-frontmatter.tsx
 * @does     Renders key-value fields for editing MDX frontmatter using schema-defined field types
 *           when available, falling back to value-based type inference.
 * @depends  @/stores/mdx-editor-store, @/components/ui/input, @/components/ui/label, @/components/ui/switch, @/components/ui/native-select
 * @do       Add new frontmatter field types here
 * @dont     Parse or validate frontmatter — that belongs in core parsers
 */

import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import type {
  FieldDefinition,
  SelectField,
  MultiSelectField,
  StatusField,
  RelationField,
  SlugField,
  ArrayField,
  StatusOption,
} from "@shared/fields";

interface Props {
  fields?: FieldDefinition[];
}

export function MdxFrontmatter({ fields }: Props) {
  const frontmatter = useMdxEditorStore((s) => s.frontmatter);
  const updateFrontmatter = useMdxEditorStore((s) => s.updateFrontmatter);

  const fieldMap = new Map<string, FieldDefinition>();
  if (fields) {
    for (const f of fields) fieldMap.set(f.name, f);
  }

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
            schema={fieldMap.get(key)}
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

interface FieldProps {
  fieldKey: string;
  value: unknown;
  schema?: FieldDefinition;
  onChange: (value: unknown) => void;
}

function FrontmatterField({ fieldKey, value, schema, onChange }: FieldProps) {
  // When a schema field definition exists, use it to determine the input type
  if (schema) {
    return <SchemaField fieldKey={fieldKey} value={value} schema={schema} onChange={onChange} />;
  }

  // Fallback: infer from the value type
  return <InferredField fieldKey={fieldKey} value={value} onChange={onChange} />;
}

function SchemaField({
  fieldKey,
  value,
  schema,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  schema: FieldDefinition;
  onChange: (value: unknown) => void;
}) {
  const label = ("label" in schema && schema.label) ? String(schema.label) : fieldKey;

  switch (schema.type) {
    case "boolean":
      return (
        <Row label={label}>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        </Row>
      );

    case "select": {
      const opts = (schema as SelectField).options ?? [];
      return (
        <Row label={label}>
          <NativeSelect
            value={String(value ?? "")}
            onChange={onChange}
            options={[{ label: "—", value: "" }, ...opts]}
          />
        </Row>
      );
    }

    case "multi-select": {
      const opts = (schema as MultiSelectField).options ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Row label={label}>
          <MultiSelectInput options={opts} selected={selected} onChange={onChange} />
        </Row>
      );
    }

    case "long-text":
      return (
        <Row label={label}>
          <textarea
            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        </Row>
      );

    case "date":
      return (
        <Row label={label}>
          <Input
            type={typeof value === "string" && RE_ISO_DATE.test(value) ? "date" : "text"}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </Row>
      );

    case "number":
      return (
        <Row label={label}>
          <Input
            type="number"
            value={String(value ?? "")}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
          />
        </Row>
      );

    case "url":
      return (
        <Row label={label}>
          <Input type="url" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );

    case "email":
      return (
        <Row label={label}>
          <Input type="email" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );

    case "status": {
      const statusOpts = (schema as StatusField).options ?? [];
      return (
        <Row label={label}>
          <StatusSelect value={String(value ?? "")} options={statusOpts} onChange={onChange} />
        </Row>
      );
    }

    case "media":
      return (
        <Row label={label}>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Path or URL to media file"
          />
        </Row>
      );

    case "slug": {
      const fromField = (schema as SlugField).from;
      return (
        <Row label={label}>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fromField ? `Generated from "${fromField}"` : "slug"}
          />
        </Row>
      );
    }

    case "relation": {
      const rel = schema as RelationField;
      return (
        <Row label={label}>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Slug from "${rel.collection}"`}
          />
        </Row>
      );
    }

    case "array": {
      const items = Array.isArray(value) ? value : [];
      const itemFields = (schema as ArrayField).itemFields;
      // Simple string arrays: render as comma-separated
      if (itemFields.length === 0 || (itemFields.length === 1 && itemFields[0]?.type === "text")) {
        return (
          <Row label={label}>
            <Input
              value={items.map(String).join(", ")}
              onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="comma-separated"
            />
          </Row>
        );
      }
      // Complex arrays: show count (editing in the sheet is better suited)
      return (
        <Row label={label}>
          <span className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </Row>
      );
    }

    case "id":
    case "created-time":
    case "updated-time":
    case "formula":
      // Read-only computed fields
      return (
        <Row label={label}>
          <Input type="text" value={String(value ?? "")} readOnly className="opacity-60" />
        </Row>
      );

    default:
      return (
        <Row label={label}>
          <Input type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
  }
}

function InferredField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <Row label={fieldKey}>
        <Switch checked={value} onCheckedChange={onChange} />
      </Row>
    );
  }

  if (Array.isArray(value)) {
    return (
      <Row label={fieldKey}>
        <Input
          value={value.join(", ")}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()))}
          placeholder="comma-separated"
        />
      </Row>
    );
  }

  if (typeof value === "string") {
    if (RE_ISO_DATETIME.test(value) && !RE_ISO_DATE.test(value)) {
      return (
        <Row label={fieldKey}>
          <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    }
    if (RE_ISO_DATE.test(value)) {
      return (
        <Row label={fieldKey}>
          <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    }
  }

  return (
    <Row label={fieldKey}>
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
    </Row>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Label className="w-36 shrink-0 text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  gray: "bg-neutral-200 text-neutral-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
};

function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: StatusOption[];
  onChange: (value: unknown) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const colorClass = STATUS_COLORS[opt.color ?? "gray"] ?? STATUS_COLORS.gray;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity ${colorClass} ${
              isActive ? "opacity-100 ring-1 ring-foreground/30" : "opacity-40 hover:opacity-70"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectInput({
  options,
  selected,
  onChange,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (isSelected) onChange(selected.filter((v) => v !== opt.value));
              else onChange([...selected, opt.value]);
            }}
            className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
