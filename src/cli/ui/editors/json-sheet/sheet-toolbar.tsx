"use client";

/**
 * @context  UI editor — sheet toolbar at src/cli/ui/editors/json-sheet/sheet-toolbar.tsx
 * @does     Renders the top bar with collection name, locale filter, add row button, and save button
 * @depends  @/stores/editor-store, @/actions/collections
 * @do       Add sheet-level actions (import CSV, export) to this toolbar
 * @dont     Put editor state logic here — that belongs in the store
 */

import { useTransition, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { saveCollectionJson, saveMdxFrontmatter } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Columns3 } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/components/ui/toast";
import { keyLabel } from "@shared/field-utils";

interface Props {
  collectionName: string;
  hasSync?: boolean;
  locales?: Array<string | undefined>;
  selectedLocale?: string | undefined;
  onLocaleChange?: (locale: string | undefined) => void;
}

export function SheetToolbar({ collectionName, hasSync, locales, selectedLocale, onLocaleChange }: Props) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const filePath = useEditorStore((s) => s.filePath);
  const isMdx = useEditorStore((s) => s.isMdx);
  const addRow = useEditorStore((s) => s.addRow);
  const getSerializedJson = useEditorStore((s) => s.getSerializedJson);
  const getMdxSources = useEditorStore((s) => s.getMdxSources);
  const markClean = useEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!isDirty || isPending) return;
    startTransition(async () => {
      const result = isMdx
        ? await saveMdxFrontmatter(getMdxSources())
        : await saveCollectionJson(filePath, getSerializedJson());
      if (result.success) {
        markClean();
        toast("Saved successfully", "success");
      } else {
        toast(result.error ?? "Save failed", "error");
      }
    });
  }, [isDirty, isPending, isMdx, filePath, getMdxSources, getSerializedJson, markClean, startTransition]);

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
        {locales && locales.length > 1 && (
          <div className="flex items-center rounded-md border overflow-hidden">
            {locales.map((locale) => {
              const label = locale ?? "default";
              const isActive = locale === selectedLocale;
              return (
                <button
                  key={label}
                  onClick={() => onLocaleChange?.(locale)}
                  className={`h-7 px-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
        <ColumnVisibilityToggle />
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

function ColumnVisibilityToggle() {
  const rows = useEditorStore((s) => s.rows);
  const fieldDefs = useEditorStore((s) => s.fieldDefs);
  const visibleColumns = useEditorStore((s) => s.visibleColumns);
  const hasCustomVisibility = useEditorStore((s) => s.hasCustomVisibility);
  const toggleColumnVisibility = useEditorStore((s) => s.toggleColumnVisibility);
  const resetColumnVisibility = useEditorStore((s) => s.resetColumnVisibility);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) keys.add(key);
    }
    return Array.from(keys);
  }, [rows]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (allColumns.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2.5 text-xs"
        onClick={() => setOpen(!open)}
      >
        <Columns3 className="h-3.5 w-3.5" />
        Columns
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Visible columns
            </p>
            {hasCustomVisibility && (
              <button
                type="button"
                onClick={resetColumnVisibility}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-auto">
            {allColumns.map((col, idx) => {
              const visible = hasCustomVisibility
                ? visibleColumns.has(col)
                : idx < 5;
              const label = fieldDefs[col]?.label ?? keyLabel(col);
              return (
                <label
                  key={col}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumnVisibility(col)}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span className="truncate">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
