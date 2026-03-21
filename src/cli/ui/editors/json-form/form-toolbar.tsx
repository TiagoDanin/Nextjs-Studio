"use client";

/**
 * @context  UI editor — form toolbar at src/cli/ui/editors/json-form/form-toolbar.tsx
 * @does     Renders the top bar with collection name, dirty indicator, and save button
 * @depends  @/stores/editor-store, @/actions/collections
 * @do       Add form-level actions (reset, export) to this toolbar
 * @dont     Put editor state logic here — that belongs in the store
 */

import { useTransition, useState, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { saveCollectionJson } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/components/ui/toast";

interface Props {
  collectionName: string;
  hasSync?: boolean;
}

export function FormToolbar({ collectionName, hasSync }: Props) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const filePath = useEditorStore((s) => s.filePath);
  const getSerializedJson = useEditorStore((s) => s.getSerializedJson);
  const markClean = useEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!isDirty || isPending) return;
    const invalidInputs = document.querySelectorAll("input:invalid");
    if (invalidInputs.length > 0) {
      toast("Fix invalid fields before saving", "error");
      (invalidInputs[0] as HTMLElement).focus();
      return;
    }
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

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/sync/${collectionName}`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Sync completed", "success");
        window.location.reload();
      } else {
        toast(data.error ?? "Sync failed", "error");
      }
    } catch {
      toast("Sync failed", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [collectionName, isSyncing]);

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
        {hasSync && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync"}
          </Button>
        )}
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
