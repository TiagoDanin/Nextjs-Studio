"use client";

/**
 * @context  UI editor — recursive tree node at src/cli/ui/editors/json-form/tree-node.tsx
 * @does     Renders a recursive tree view for nested JSON objects with inline editing
 * @depends  @/stores/editor-store, @/components/ui/*, ./tree-controls
 * @do       Add new node-level features (drag reorder, type conversion) here
 * @dont     Put form-level layout here — that belongs in json-form-editor.tsx
 */

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { keyLabel } from "@shared/field-utils";
import { FormField } from "./form-field";
import { TreeControls } from "./tree-controls";

interface Props {
  label: string;
  path: string;
  data: Record<string, unknown>;
  depth?: number;
}

export function TreeNode({ label, path, data, depth = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const entries = Object.entries(data);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 py-1">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              isOpen && "rotate-90",
            )}
          />
          <Label className="cursor-pointer text-sm text-muted-foreground">
            {label}
          </Label>
          <span className="text-xs text-muted-foreground">
            ({entries.length} field{entries.length !== 1 ? "s" : ""})
          </span>
        </CollapsibleTrigger>
        <TreeControls path={path} />
      </div>
      <CollapsibleContent>
        <div className="ml-4 flex flex-col gap-3 border-l pl-4 pt-2">
          {entries.map(([key, value]) => {
            const childPath = `${path}.${key}`;

            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              return (
                <div key={key} className="flex flex-col gap-1">
                  <TreeNode
                    label={keyLabel(key)}
                    path={childPath}
                    data={value as Record<string, unknown>}
                    depth={depth + 1}
                  />
                  <TreeControls path={childPath} showFieldControls />
                </div>
              );
            }

            return (
              <div key={key} className="flex items-start gap-1">
                <div className="flex-1">
                  <FormField
                    fieldKey={key}
                    path={childPath}
                    value={value}
                  />
                </div>
                <TreeControls path={childPath} showFieldControls />
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
