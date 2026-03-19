"use client";

/**
 * @context  UI editor — component props panel at src/cli/ui/editors/mdx-editor/component-props-panel.tsx
 * @does     Renders a side panel for editing component block props using form fields
 * @depends  @/stores/mdx-editor-store, @shared/component-types
 * @do       Add prop validation feedback here
 * @dont     Put component rendering logic here — CMS only edits props
 */

import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { keyLabel } from "@shared/field-utils";
import type { ComponentDefinition } from "@shared/component-types";

interface Props {
  registry: ComponentDefinition[];
}

export function ComponentPropsPanel({ registry }: Props) {
  const selectedComponent = useMdxEditorStore((s) => s.selectedComponent);
  const setSelectedComponent = useMdxEditorStore((s) => s.setSelectedComponent);

  if (!selectedComponent) return null;

  const def = registry.find((c) => c.tagName === selectedComponent.tagName);
  if (!def) return null;

  const attrs = selectedComponent.attrs as Record<string, unknown>;
  const props = (attrs.props ?? {}) as Record<string, unknown>;

  function updateProp(key: string, value: unknown) {
    if (!selectedComponent || !setSelectedComponent) return;
    setSelectedComponent({
      ...selectedComponent,
      attrs: {
        ...selectedComponent.attrs,
        props: { ...props, [key]: value },
      },
    });
  }

  return (
    <div className="w-72 shrink-0 border-l bg-muted/20">
      <div className="flex h-10 items-center justify-between border-b px-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/80">
          {def.name} Props
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedComponent?.(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        {def.props.map((field) => {
          const value = props[field.name];
          const label = field.label ?? keyLabel(field.name);

          if (field.type === "boolean") {
            return (
              <div key={field.name} className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Switch
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => updateProp(field.name, checked)}
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
                  onChange={(e) => updateProp(field.name, Number(e.target.value))}
                  className="h-7 text-sm"
                />
              </div>
            );
          }

          return (
            <div key={field.name} className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                type="text"
                value={String(value ?? "")}
                onChange={(e) => updateProp(field.name, e.target.value)}
                className="h-7 text-sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
