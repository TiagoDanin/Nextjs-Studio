"use client";

/**
 * @context  UI editor — frontmatter panel at src/cli/ui/editors/mdx-editor/mdx-frontmatter.tsx
 * @does     Renders key-value fields for editing MDX frontmatter using schema-defined field types
 *           when available, falling back to value-based type inference.
 * @depends  @/stores/mdx-editor-store, @/components/ui/input, @/components/ui/label, @/components/ui/switch, @/components/ui/native-select
 * @do       Add new frontmatter field types here
 * @dont     Parse or validate frontmatter — that belongs in core parsers
 */

import { useEffect, useRef } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { useMediaStore } from "@/stores/media-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import {
  clientSlugify,
  formatTimestamp,
  evaluateFormula,
  generateId,
  isImagePath,
  getDateInputType,
} from "@/lib/field-helpers";
import type {
  FieldDefinition,
  DateField,
  SelectField,
  MultiSelectField,
  StatusField,
  RelationField,
  SlugField,
  IdField,
  FormulaField,
  ObjectField,
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

  // When a schema is provided, render schema fields first (even if missing from frontmatter),
  // then any extra frontmatter keys not covered by the schema.
  // When no schema, fall back to rendering only what's in the frontmatter.
  const schemaFields = fields ?? [];
  const schemaKeys = new Set(schemaFields.map((f) => f.name));
  const extraKeys = Object.keys(frontmatter).filter((k) => !schemaKeys.has(k));

  return (
    <div className="border-b bg-muted/20 px-6 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Frontmatter
      </p>
      <div className="flex flex-col gap-3">
        {schemaFields.length > 0 ? (
          <>
            {schemaFields.map((field) => (
              <FrontmatterField
                key={field.name}
                fieldKey={field.name}
                value={frontmatter[field.name]}
                schema={field}
                allData={frontmatter}
                onChange={(v) => updateFrontmatter(field.name, v)}
              />
            ))}
            {extraKeys.map((key) => (
              <FrontmatterField
                key={key}
                fieldKey={key}
                value={frontmatter[key]}
                schema={undefined}
                allData={frontmatter}
                onChange={(v) => updateFrontmatter(key, v)}
              />
            ))}
          </>
        ) : (
          Object.entries(frontmatter).map(([key, value]) => (
            <FrontmatterField
              key={key}
              fieldKey={key}
              value={value}
              schema={fieldMap.get(key)}
              allData={frontmatter}
              onChange={(v) => updateFrontmatter(key, v)}
            />
          ))
        )}
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
  allData: Record<string, unknown>;
  onChange: (value: unknown) => void;
}

function FrontmatterField({ fieldKey, value, schema, allData, onChange }: FieldProps) {
  if (schema) {
    return <SchemaField fieldKey={fieldKey} value={value} schema={schema} allData={allData} onChange={onChange} />;
  }
  return <InferredField fieldKey={fieldKey} value={value} onChange={onChange} />;
}

function SchemaField({
  fieldKey,
  value,
  schema,
  allData,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  schema: FieldDefinition;
  allData: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const label = ("label" in schema && schema.label) ? String(schema.label) : fieldKey;
  const collectionName = useMdxEditorStore((s) => s.collectionName);

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

    case "date": {
      const dateType = getDateInputType(schema as DateField);
      if (dateType === "year") {
        return (
          <Row label={label}>
            <Input
              type="number"
              min={1900}
              max={2100}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder="YYYY"
            />
          </Row>
        );
      }
      return (
        <Row label={label}>
          <Input
            type={dateType}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </Row>
      );
    }

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

    case "media": {
      const mediaVal = String(value ?? "");
      return (
        <Row label={label}>
          <div className="flex flex-1 items-center gap-2">
            <Input
              type="text"
              value={mediaVal}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Path or URL to media file"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title="Pick media"
              onClick={() => {
                useMediaStore.getState().openPicker("any", (url) => {
                  onChange(url);
                }, collectionName);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {mediaVal && isImagePath(mediaVal) && (
            <MediaPreview src={mediaVal} collection={collectionName} />
          )}
        </Row>
      );
    }

    case "slug": {
      const fromField = (schema as SlugField).from;
      return (
        <Row label={label}>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => {
              const raw = e.target.value;
              if (raw) {
                onChange(clientSlugify(raw));
              } else if (fromField && allData[fromField]) {
                onChange(clientSlugify(String(allData[fromField])));
              }
            }}
            placeholder={fromField ? `Generated from "${fromField}"` : "slug"}
          />
        </Row>
      );
    }

    case "id": {
      const idSchema = schema as IdField;
      const idGenerated = useRef(false);
      useEffect(() => {
        if (!value && !idGenerated.current) {
          idGenerated.current = true;
          onChange(generateId(idSchema.generate));
        }
      }, [value, idSchema.generate, onChange]);
      return (
        <Row label={label}>
          <Input type="text" value={String(value ?? "")} readOnly className="opacity-60" />
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

    case "formula": {
      const expr = (schema as FormulaField).expression;
      const result = evaluateFormula(expr, allData);
      return (
        <Row label={label}>
          <Input type="text" value={result} readOnly className="opacity-60" />
        </Row>
      );
    }

    case "created-time":
      return (
        <Row label={label}>
          <Input
            type="text"
            value={value ? formatTimestamp(String(value)) : ""}
            readOnly
            className="opacity-60"
            title={String(value ?? "")}
          />
        </Row>
      );

    case "updated-time":
      return (
        <Row label={label}>
          <Input
            type="text"
            value={value ? formatTimestamp(String(value)) : ""}
            readOnly
            className="opacity-60"
            title={String(value ?? "")}
          />
        </Row>
      );

    case "object": {
      const subFields = (schema as ObjectField).fields;
      const obj = (typeof value === "object" && value !== null && !Array.isArray(value))
        ? (value as Record<string, unknown>)
        : {};
      const subFieldMap = new Map(subFields.map((f) => [f.name, f]));
      // Extra keys not in the sub-schema
      const extraObjKeys = Object.keys(obj).filter((k) => !subFieldMap.has(k));
      return (
        <div className="flex flex-col gap-1">
          <Label className="text-sm text-muted-foreground">{label}</Label>
          <div className="ml-4 flex flex-col gap-2 border-l pl-4">
            {subFields.map((sf) => {
              const sfLabel = ("label" in sf && sf.label) ? String(sf.label) : sf.name;
              const sfValue = obj[sf.name];
              return (
                <ObjectSubField
                  key={sf.name}
                  label={sfLabel}
                  value={sfValue}
                  schema={sf}
                  allData={allData}
                  onChange={(v) => onChange({ ...obj, [sf.name]: v })}
                  collectionName={collectionName}
                />
              );
            })}
            {extraObjKeys.map((k) => (
              <Row key={k} label={k}>
                <Input
                  type="text"
                  value={String(obj[k] ?? "")}
                  onChange={(e) => onChange({ ...obj, [k]: e.target.value })}
                />
              </Row>
            ))}
          </div>
        </div>
      );
    }

    case "array": {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      const itemFields = (schema as ArrayField).itemFields;

      // Simple string arrays: render as comma-separated
      if (itemFields.length === 0 || (itemFields.length === 1 && itemFields[0]?.type === "text")) {
        return (
          <Row label={label}>
            <Input
              value={items.map((item) => typeof item === "string" ? item : String(item)).join(", ")}
              onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="comma-separated"
            />
          </Row>
        );
      }

      // Complex arrays: inline editable items
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{label}</Label>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6"
              title="Add item"
              onClick={() => {
                const empty: Record<string, unknown> = {};
                for (const f of itemFields) empty[f.name] = "";
                onChange([...items, empty]);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="ml-4 flex flex-col gap-3 border-l pl-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 rounded border bg-muted/10 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const next = items.filter((_, i) => i !== idx);
                      onChange(next);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {itemFields.map((itemField) => {
                  const ifLabel = ("label" in itemField && itemField.label) ? String(itemField.label) : itemField.name;
                  const ifValue = typeof item === "object" && item !== null ? (item as Record<string, unknown>)[itemField.name] : "";
                  return (
                    <Row key={itemField.name} label={ifLabel}>
                      <Input
                        type={itemField.type === "url" ? "url" : itemField.type === "email" ? "email" : itemField.type === "number" ? "number" : "text"}
                        value={String(ifValue ?? "")}
                        onChange={(e) => {
                          const newItem = { ...(item as Record<string, unknown>), [itemField.name]: itemField.type === "number" ? Number(e.target.value) || 0 : e.target.value };
                          const next = [...items];
                          next[idx] = newItem;
                          onChange(next);
                        }}
                      />
                    </Row>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <Row label={label}>
          <Input type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
  }
}

/** Renders a single sub-field inside an ObjectField */
function ObjectSubField({
  label,
  value,
  schema,
  allData,
  onChange,
  collectionName,
}: {
  label: string;
  value: unknown;
  schema: FieldDefinition;
  allData: Record<string, unknown>;
  onChange: (v: unknown) => void;
  collectionName: string;
}) {
  switch (schema.type) {
    case "text":
      return (
        <Row label={label}>
          <Input type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Row>
      );
    case "long-text":
      return (
        <Row label={label}>
          <textarea
            className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
          />
        </Row>
      );
    case "media": {
      const mediaVal = String(value ?? "");
      return (
        <Row label={label}>
          <div className="flex flex-1 items-center gap-2">
            <Input
              type="text"
              value={mediaVal}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Path or URL"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                useMediaStore.getState().openPicker("image", (url) => {
                  onChange(url);
                }, collectionName);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {mediaVal && isImagePath(mediaVal) && (
            <MediaPreview src={mediaVal} collection={collectionName} />
          )}
        </Row>
      );
    }
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

  if (typeof value === "object" && value !== null) {
    // Inferred object: render sub-fields
    const obj = value as Record<string, unknown>;
    return (
      <div className="flex flex-col gap-1">
        <Label className="text-sm text-muted-foreground">{fieldKey}</Label>
        <div className="ml-4 flex flex-col gap-2 border-l pl-4">
          {Object.entries(obj).map(([k, v]) => (
            <Row key={k} label={k}>
              {typeof v === "boolean" ? (
                <Switch checked={v} onCheckedChange={(checked) => onChange({ ...obj, [k]: checked })} />
              ) : (
                <Input
                  type={typeof v === "number" ? "number" : "text"}
                  value={String(v ?? "")}
                  onChange={(e) => {
                    const newVal = typeof v === "number" ? (Number(e.target.value) || 0) : e.target.value;
                    onChange({ ...obj, [k]: newVal });
                  }}
                />
              )}
            </Row>
          ))}
        </div>
      </div>
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
    <div className="flex items-start gap-4">
      <Label className="w-36 shrink-0 pt-2 text-sm text-muted-foreground">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function MediaPreview({ src, collection }: { src: string; collection: string }) {
  // Use the public API route to serve media files
  const url = src.startsWith("http") ? src : `/api/public/${collection}/media/${src.replace(/^\//, "")}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="mt-1 h-10 w-10 rounded border object-cover"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
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
