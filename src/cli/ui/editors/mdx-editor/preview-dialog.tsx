"use client";

/**
 * @context  UI editor — preview modal at src/cli/ui/editors/mdx-editor/preview-dialog.tsx
 * @does     Renders the MDX content as HTML in a full-screen dialog overlay
 * @depends  @/stores/mdx-editor-store for rendered HTML
 * @do       Add print support or external preview window option here
 * @dont     Re-render MDX here — use the pre-rendered HTML from the store
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PreviewDialog({ open, onClose }: Props) {
  const renderedHtml = useMdxEditorStore((s) => s.renderedHtml);
  const slug = useMdxEditorStore((s) => s.slug);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">{slug}.mdx — Preview</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-10 py-8">
          <div
            className="tiptap"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
