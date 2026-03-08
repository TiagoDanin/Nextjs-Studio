"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { SheetToolbar } from "./sheet-toolbar";
import { SheetTable } from "./sheet-table";
import type { CollectionSummary, SerializableEntry } from "@/actions/collections";

interface Props {
  collection: CollectionSummary;
  entries: SerializableEntry[];
  filePath: string;
}

export function JsonSheetEditor({ collection, entries, filePath }: Props) {
  const initSheet = useEditorStore((s) => s.initSheet);

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
      <div className="studio-canvas px-4 py-4 md:px-6">
        <div className="h-full overflow-hidden rounded-xl border bg-card">
          <SheetTable />
        </div>
      </div>
    </div>
  );
}
