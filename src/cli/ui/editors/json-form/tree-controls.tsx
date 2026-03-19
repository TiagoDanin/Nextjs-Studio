"use client";

/**
 * @context  UI editor — tree inline controls at src/cli/ui/editors/json-form/tree-controls.tsx
 * @does     Provides inline add/delete/reorder controls for tree nodes
 * @depends  @/stores/editor-store, @/components/ui/button
 * @do       Add new node operations (duplicate, convert type) here
 * @dont     Put rendering logic here — that belongs in tree-node.tsx
 */

import { useEditorStore } from "@/stores/editor-store";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface Props {
  path: string;
  showFieldControls?: boolean;
}

export function TreeControls({ path, showFieldControls }: Props) {
  const deleteField = useEditorStore((s) => s.deleteField);
  const reorderField = useEditorStore((s) => s.reorderField);

  if (!showFieldControls) return null;

  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/tree:opacity-100 hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={() => reorderField(path, "up")}
        title="Move up"
        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => reorderField(path, "down")}
        title="Move down"
        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => deleteField(path)}
        title="Delete field"
        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
