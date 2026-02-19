"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { SheetToolbar } from "./sheet-toolbar";
import { SheetTable } from "./sheet-table";
import { SheetRowInspector } from "./sheet-row-inspector";
import type { CollectionSummary, SerializableEntry } from "@/actions/collections";

interface Props {
  collection: CollectionSummary;
  entries: SerializableEntry[];
  filePath: string;
  readOnly?: boolean;
}

export function JsonSheetEditor({ collection, entries, filePath, readOnly = false }: Props) {
  const initSheet = useEditorStore((s) => s.initSheet);
  const selectedRowIndex = useEditorStore((s) => s.selectedRowIndex);

  useEffect(() => {
    const rows = entries.map((e) => e.data);
    initSheet(collection.name, filePath, rows);
  }, [collection.name, filePath, entries, initSheet]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SheetToolbar collectionName={collection.name} readOnly={readOnly} />
      <div className="flex-1 overflow-auto">
        <SheetTable readOnly={readOnly} />
      </div>
      {selectedRowIndex !== null && <SheetRowInspector />}
    </div>
  );
}
