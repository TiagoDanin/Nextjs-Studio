"use client";

/**
 * @context  UI editor — form toolbar at src/cli/ui/editors/json-form/form-toolbar.tsx
 * @does     Renders the top bar with collection name, dirty indicator, and save button
 * @depends  @/stores/editor-store, @/actions/collections
 * @do       Add form-level actions (reset, export) to this toolbar
 * @dont     Put editor state logic here — that belongs in the store
 */

import { useTransition, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { saveCollectionJson } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/components/ui/toast";

interface Props {
  collectionName: string;
}

export function FormToolbar({ collectionName }: Props) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const filePath = useEditorStore((s) => s.filePath);
  const getSerializedJson = useEditorStore((s) => s.getSerializedJson);
  const markClean = useEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!isDirty || isPending) return;
    startTransition(async () => {
      const json = getSerializedJson();
      const result = await saveCollectionJson(filePath, json);
      if (result.success) {
        markClean();
        toast("Saved successfully", "success");
      } else {
        toast(result.error ?? "Save failed", "error");
      }
    });
  }, [isDirty, isPending, filePath, getSerializedJson, markClean, startTransition]);

  useKeyboardShortcuts({ onSave: handleSave });

  return (
    <div className="studio-topbar">
      <div className="flex items-center gap-2 text-[14px]">
        <span className="font-bold capitalize tracking-tight">{collectionName}</span>
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={handleSave}
          disabled={!isDirty || isPending}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
