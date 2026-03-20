"use client";

/**
 * @context  UI editor — JSON sheet view at src/cli/ui/editors/json-sheet/json-sheet-editor.tsx
 * @does     Initializes the editor store and composes the sheet toolbar with the data table
 * @depends  @/stores/editor-store, ./sheet-toolbar, ./sheet-table
 * @do       Add sheet-level features (column visibility, filters) here
 * @dont     Put table rendering logic here — that belongs in sheet-table.tsx
 */

import { useEffect, useState, useMemo } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { SheetToolbar } from "./sheet-toolbar";
import { SheetTable } from "./sheet-table";
import type { CollectionSummary, SerializableEntry } from "@/actions/collections";

interface Props {
  collection: CollectionSummary;
  entries: SerializableEntry[];
  filePath: string;
  hasSync?: boolean;
}

export function JsonSheetEditor({ collection, entries, filePath, hasSync }: Props) {
  const initSheet = useEditorStore((s) => s.initSheet);

  // Detect available locales (undefined = base/no suffix)
  const availableLocales = useMemo(() => {
    const seen = new Set<string>();
    const locales: Array<string | undefined> = [];
    for (const entry of entries) {
      const key = entry.locale ?? "__base__";
      if (!seen.has(key)) {
        seen.add(key);
        locales.push(entry.locale);
      }
    }
    return locales;
  }, [entries]);

  const hasI18n = availableLocales.length > 1;

  // Default to base locale (undefined = no suffix)
  const [selectedLocale, setSelectedLocale] = useState<string | undefined>(undefined);

  const filteredEntries = useMemo(() => {
    if (!hasI18n) return entries;
    return entries.filter((e) => e.locale === selectedLocale);
  }, [entries, selectedLocale, hasI18n]);

  useEffect(() => {
    const rows = filteredEntries.map((e) => e.data);
    const mdxSources =
      collection.type === "mdx"
        ? filteredEntries.map((e) => ({ slug: e.slug, filePath: e.filePath, body: e.body ?? "" }))
        : undefined;
    initSheet(collection.name, filePath, rows, mdxSources, collection.fields);
  }, [collection.name, collection.type, collection.fields, filePath, filteredEntries, initSheet]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SheetToolbar
        collectionName={collection.name}
        hasSync={hasSync}
        locales={hasI18n ? availableLocales : undefined}
        selectedLocale={selectedLocale}
        onLocaleChange={setSelectedLocale}
      />
      <div className="studio-canvas px-4 py-4 md:px-6">
        <div className="h-full overflow-hidden rounded-xl border bg-card">
          <SheetTable />
        </div>
      </div>
    </div>
  );
}
