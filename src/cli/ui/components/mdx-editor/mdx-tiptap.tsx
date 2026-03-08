"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { Markdown } from "tiptap-markdown";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import type { Editor } from "@tiptap/core";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { SlashCommand } from "./slash-command";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

export function MdxTiptap() {
  const slug = useMdxEditorStore((s) => s.slug);
  const updateBody = useMdxEditorStore((s) => s.updateBody);
  const updateRenderedHtml = useMdxEditorStore((s) => s.updateRenderedHtml);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start writing, or type "/" for commands…',
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({ transformPastedText: true }),
      GlobalDragHandle,
      SlashCommand,
    ],
    content: useMdxEditorStore.getState().body,
    onUpdate({ editor }) {
      updateBody(editor.storage.markdown.getMarkdown() as string);
      updateRenderedHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(useMdxEditorStore.getState().body);
    }
  }, [slug, editor]);

  return (
    <div className="flex flex-col">
      {editor && <FixedToolbar editor={editor} />}
      {editor && <BubbleToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="px-6 py-8 md:px-8 [&_.tiptap]:min-h-[65vh]"
      />
    </div>
  );
}

// ─── Fixed formatting toolbar ─────────────────────────────────────────────────

function FixedToolbar({ editor }: { editor: Editor }) {
  // Re-render when editor selection or content changes so active states update
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

  return (
    <div className="sticky top-0 z-10 px-6 pt-4">
      <div className="flex h-11 shrink-0 items-center gap-px rounded-xl border bg-card px-3">
      {/* History */}
      <TBtn
        onClick={() => editor.chain().focus().undo().run()}
        active={false}
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().redo().run()}
        active={false}
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </TBtn>

      <Sep />

      {/* Block type */}
      <TBtn
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={
          editor.isActive("paragraph") && !editor.isActive("heading")
        }
        title="Normal text"
      >
        <Type className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </TBtn>

      <Sep />

      {/* Inline formatting */}
      <TBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <Code className="h-3.5 w-3.5" />
      </TBtn>

      <Sep />

      {/* Link */}
      <TBtn onClick={setLink} active={editor.isActive("link")} title="Link">
        <LinkIcon className="h-3.5 w-3.5" />
      </TBtn>
      </div>
    </div>
  );
}

// ─── Bubble toolbar (appears on text selection) ────────────────────────────────

function BubbleToolbar({ editor }: { editor: Editor }) {
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);

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

  if (!coords) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-px rounded-lg border bg-popover/95 p-1 shadow-xl backdrop-blur-sm"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive("heading", { level: 1 })}
        title="H1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        title="H2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        title="H3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={() => {
          const prev = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("URL", prev ?? "");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>,
    document.body,
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Sep() {
  return <div className="mx-1.5 h-[18px] w-px shrink-0 bg-border" />;
}

/** Button for the fixed toolbar — slightly smaller padding */
function TBtn({
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
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        "text-foreground/60 hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}
