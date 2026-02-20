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
}

export function JsonSheetEditor({ collection, entries, filePath }: Props) {
  const initSheet = useEditorStore((s) => s.initSheet);
  const selectedRowIndex = useEditorStore((s) => s.selectedRowIndex);

  useEffect(() => {
    const rows = entries.map((e) => e.data);
    const mdxSources =
      collection.type === "mdx"
        ? entries.map((e) => ({ slug: e.slug, filePath: e.filePath, body: e.body ?? "" }))
        : undefined;
    initSheet(collection.name, filePath, rows, mdxSources);
  }, [collection.name, collection.type, filePath, entries, initSheet]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SheetToolbar collectionName={collection.name} />
      <div className="flex-1 overflow-auto">
        <SheetTable />
      </div>
      {selectedRowIndex !== null && <SheetRowInspector />}
    </div>
  );
}
