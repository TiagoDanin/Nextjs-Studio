"use client";

import { useState, useTransition } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { saveMdxFrontmatter } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { PreviewDialog } from "./preview-dialog";
import { Eye, Save } from "lucide-react";

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

  const title = `${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}: ${slug}.mdx`;

  function handleSave() {
    startTransition(async () => {
      const result = await saveMdxFrontmatter([{ filePath, frontmatter, body }]);
      if (result.success) markClean();
    });
  }

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {isDirty && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isPending}>
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
