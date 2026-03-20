"use client";

/**
 * @context  UI editor — component props panel at src/cli/ui/editors/mdx-editor/component-props-panel.tsx
 * @does     Renders a side panel for editing component block props using form fields
 * @depends  @/stores/mdx-editor-store, @shared/component-types
 * @do       Add prop validation feedback here
 * @dont     Put component rendering logic here — CMS only edits props
 */

import { useState } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { keyLabel } from "@shared/field-utils";
import type { ComponentDefinition } from "@shared/component-types";
import type { SelectField } from "@shared/fields";

interface Props {
  registry: ComponentDefinition[];
}

export function ComponentPropsPanel({ registry }: Props) {
  const selectedComponent = useMdxEditorStore((s) => s.selectedComponent);
  const setSelectedComponent = useMdxEditorStore((s) => s.setSelectedComponent);
  const updateComponentProp = useMdxEditorStore((s) => s.updateComponentProp);
  const [newPropName, setNewPropName] = useState("");

  if (!selectedComponent) return null;

  const { tagName, props } = selectedComponent;
  const def = registry.find((c) => c.tagName === tagName);

  function handleAddProp() {
    const name = newPropName.trim();
    if (!name) return;
    updateComponentProp(name, "");
    setNewPropName("");
  }

  // If we have a registry definition, render schema-based fields
  // Otherwise, render generic fields from existing props
  const fields = def?.props ?? Object.keys(props).map((name) => ({
    name,
    type: typeof props[name] === "boolean" ? "boolean" as const
      : typeof props[name] === "number" ? "number" as const
      : "text" as const,
  }));

  return (
    <div className="w-72 shrink-0 border-l bg-muted/20">
      <div className="flex h-10 items-center justify-between border-b px-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/80">
          {def?.name ?? tagName} Props
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedComponent(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tag name editor */}
      <div className="border-b px-4 py-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Tag Name</Label>
          {def ? (
            <span className="text-sm font-medium">&lt;{tagName} /&gt;</span>
          ) : (
            <Input
              type="text"
              value={tagName}
              onChange={(e) => {
                const newTag = e.target.value;
                selectedComponent.updateAttributes?.({ tagName: newTag });
                setSelectedComponent({ ...selectedComponent, tagName: newTag });
              }}
              className="h-7 text-sm"
              placeholder="ComponentName"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {fields.map((field) => {
          const value = props[field.name];
          const label = ("label" in field && field.label) ? String(field.label) : keyLabel(String(field.name));

          if (field.type === "boolean") {
            return (
              <div key={field.name} className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => updateComponentProp(field.name, checked)}
                />
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.name} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  value={String(value ?? "")}
                  onChange={(e) => updateComponentProp(field.name, Number(e.target.value))}
                  className="h-7 text-sm"
                />
              </div>
            );
          }

          if (field.type === "select" && "options" in field) {
            const opts = (field as SelectField).options ?? [];
            return (
              <div key={field.name} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <NativeSelect
                  value={String(value ?? "")}
                  onChange={(v) => updateComponentProp(field.name, v)}
                  options={[{ label: "—", value: "" }, ...opts]}
                  className="h-7 px-2"
                />
              </div>
            );
          }

          return (
            <div key={field.name} className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                type={field.type === "url" ? "url" : "text"}
                value={String(value ?? "")}
                onChange={(e) => updateComponentProp(field.name, e.target.value)}
                className="h-7 text-sm"
                placeholder={("placeholder" in field ? (field as { placeholder?: string }).placeholder : undefined) ?? ""}
              />
            </div>
          );
        })}

        {/* Add custom prop (only when no registry definition) */}
        {!def && (
          <div className="flex items-center gap-1.5 pt-2 border-t">
            <Input
              type="text"
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProp()}
              className="h-7 flex-1 text-sm"
              placeholder="New prop name"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleAddProp}
              disabled={!newPropName.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
