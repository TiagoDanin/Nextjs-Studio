"use client";

import { useTransition } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { saveCollectionJson, saveMdxFrontmatter } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  collectionName: string;
}

export function SheetToolbar({ collectionName }: Props) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const filePath = useEditorStore((s) => s.filePath);
  const isMdx = useEditorStore((s) => s.isMdx);
  const addRow = useEditorStore((s) => s.addRow);
  const getSerializedJson = useEditorStore((s) => s.getSerializedJson);
  const getMdxSources = useEditorStore((s) => s.getMdxSources);
  const markClean = useEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = isMdx
        ? await saveMdxFrontmatter(getMdxSources())
        : await saveCollectionJson(filePath, getSerializedJson());
      if (result.success) {
        markClean();
      }
    });
  }

  return (
    <div className="studio-topbar">
      <div className="flex items-center gap-2 text-[14px]">
        <span className="font-bold capitalize tracking-tight">{collectionName}</span>
        {isDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {!isMdx && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={addRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
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
