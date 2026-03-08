"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
  Type,
  Download,
  ChevronDown,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaStore } from "@/stores/media-store";
import { BLOCK_ACTIONS } from "./editor-actions";

// ─── Shared primitive ─────────────────────────────────────────────────────────

export function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        "text-foreground/60 hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Sep() {
  return <div className="mx-1.5 h-4.5 w-px shrink-0 bg-border" />;
}

// ─── Fixed formatting toolbar ─────────────────────────────────────────────────

export function FixedToolbar({ editor }: { editor: Editor }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const tick = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", tick);
    editor.on("update", tick);
    return () => {
      editor.off("selectionUpdate", tick);
      editor.off("update", tick);
    };
  }, [editor]);

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }

  const headingActions = BLOCK_ACTIONS.filter((a) => a.toolbarExec && a.isActive);

  return (
    <div className="sticky top-0 z-10 px-6 pt-4">
      <div className="flex h-11 shrink-0 items-center gap-px rounded-xl border bg-card px-3">
        {/* History */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Block type */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph") && !editor.isActive("heading")}
          title="Normal text"
        >
          <Type className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {headingActions.map((a) => (
          <ToolbarBtn
            key={a.title}
            onClick={() => a.toolbarExec!(editor)}
            active={a.isActive!(editor)}
            title={a.title}
          >
            {a.icon}
          </ToolbarBtn>
        ))}

        <Sep />

        {/* Inline formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Media */}
        <ToolbarBtn
          onClick={() => {
            useMediaStore.getState().openPicker("any", (url, name, mimeType) => {
              insertAssetInEditor(editor, url, name, mimeType);
            });
          }}
          active={false}
          title="Insert media"
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="flex-1" />

        {/* Export */}
        <ExportMenu editor={editor} />
      </div>
    </div>
  );
}

// ─── Export dropdown ───────────────────────────────────────────────────────────

function ExportMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function exportMarkdown() {
    const md = (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
    download(md, "content.md", "text/markdown");
    setOpen(false);
  }

  function exportHtml() {
    const html = `<!doctype html>\n<html>\n<body>\n${editor.getHTML()}\n</body>\n</html>`;
    download(html, "content.html", "text/html");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Export"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors",
          "text-foreground/60 hover:bg-accent hover:text-accent-foreground",
          open && "bg-accent text-accent-foreground",
        )}
      >
        <Download className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <button
            type="button"
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
          >
            Export as Markdown
          </button>
          <button
            type="button"
            onClick={exportHtml}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
          >
            Export as HTML
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Bubble toolbar (appears on text selection) ────────────────────────────────

export function BubbleToolbar({ editor }: { editor: Editor }) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const show = () => {
      if (editor.state.selection.empty) {
        setCoords(null);
        return;
      }
      const sel = window.getSelection();
      if (!sel?.rangeCount) {
        setCoords(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setCoords({ top: rect.top - 48, left: rect.left + rect.width / 2 });
    };

    editor.on("selectionUpdate", show);
    editor.on("blur", () => setCoords(null));
    return () => {
      editor.off("selectionUpdate", show);
      editor.off("blur", () => setCoords(null));
    };
  }, [editor]);

  const headingActions = BLOCK_ACTIONS.filter((a) => a.toolbarExec && a.isActive);

  if (!coords) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateX(-50%)", zIndex: 50 }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-px rounded-lg border bg-popover/95 p-1 shadow-xl backdrop-blur-sm"
    >
      {(
        [
          { exec: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), title: "Bold", Icon: Bold },
          { exec: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), title: "Italic", Icon: Italic },
          { exec: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), title: "Strikethrough", Icon: Strikethrough },
          { exec: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code"), title: "Inline code", Icon: Code },
        ] as const
      ).map(({ exec, active, title, Icon }) => (
        <ToolbarBtn key={title} onClick={exec} active={active} title={title}>
          <Icon className="h-3.5 w-3.5" />
        </ToolbarBtn>
      ))}

      <div className="mx-1 h-4 w-px bg-border" />

      {headingActions.map((a) => (
        <ToolbarBtn
          key={a.title}
          onClick={() => a.toolbarExec!(editor)}
          active={a.isActive!(editor)}
          title={a.title}
        >
          {a.icon}
        </ToolbarBtn>
      ))}

      <div className="mx-1 h-4 w-px bg-border" />

      <ToolbarBtn
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL", prev ?? "");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>,
    document.body,
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function insertAssetInEditor(editor: Editor, url: string, name: string, mimeType: string) {
  const isMedia =
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/");

  if (isMedia) {
    editor.chain().focus().setImage({ src: url, alt: name }).run();
  } else {
    editor.chain().focus().insertContent(`<a href="${url}">${name}</a>`).run();
  }
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
