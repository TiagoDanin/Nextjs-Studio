"use client";

/**
 * @context  UI editor — MDX page toolbar at src/cli/ui/editors/mdx-editor/mdx-toolbar.tsx
 * @does     Renders the top bar with breadcrumb, save button, and preview toggle for an MDX entry
 * @depends  @/stores/mdx-editor-store, @/actions/collections, ./preview-dialog
 * @do       Add entry-level actions (delete, duplicate, history) to this toolbar
 * @dont     Put formatting toolbar buttons here — those belong in toolbar.tsx
 */

import { useState, useTransition, useCallback } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { saveMdxFrontmatter } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { PreviewDialog } from "./preview-dialog";
import { Eye, ChevronRight } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/components/ui/toast";

export function MdxToolbar() {
  const isDirty = useMdxEditorStore((s) => s.isDirty);
  const slug = useMdxEditorStore((s) => s.slug);
  const collectionName = useMdxEditorStore((s) => s.collectionName);
  const filePath = useMdxEditorStore((s) => s.filePath);
  const frontmatter = useMdxEditorStore((s) => s.frontmatter);
  const body = useMdxEditorStore((s) => s.body);
  const markClean = useMdxEditorStore((s) => s.markClean);
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSave = useCallback(() => {
    if (!isDirty || isPending) return;
    startTransition(async () => {
      const result = await saveMdxFrontmatter([{ filePath, frontmatter, body }]);
      if (result.success) {
        markClean();
        toast("Saved successfully", "success");
      } else {
        toast(result.error ?? "Save failed", "error");
      }
    });
  }, [isDirty, isPending, filePath, frontmatter, body, markClean, startTransition]);

  useKeyboardShortcuts({ onSave: handleSave });

  return (
    <>
      <div className="studio-topbar">
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="capitalize text-muted-foreground">{collectionName}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="font-bold tracking-tight">{slug}.mdx</span>
          {isDirty && (
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-foreground/40" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
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
      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
