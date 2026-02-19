"use client";

import { useTransition } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { saveCollectionJson } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface Props {
  collectionName: string;
}

export function FormToolbar({ collectionName }: Props) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const filePath = useEditorStore((s) => s.filePath);
  const getSerializedJson = useEditorStore((s) => s.getSerializedJson);
  const markClean = useEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const json = getSerializedJson();
      const result = await saveCollectionJson(filePath, json);
      if (result.success) {
        markClean();
      }
    });
  }

  return (
    <div className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{collectionName}</h2>
        {isDirty && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isPending}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
