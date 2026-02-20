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
import { Bold, Italic, Code, Heading1, Heading2, Heading3, Link as LinkIcon } from "lucide-react";
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
      Placeholder.configure({ placeholder: 'Start writing, or type "/" for commands...' }),
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
    <div>
      {editor && <BubbleToolbar editor={editor} />}
      <EditorContent editor={editor} className="px-10 py-8 [&_.tiptap]:min-h-[60vh]" />
    </div>
  );
}

function BubbleToolbar({ editor }: { editor: Editor }) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const show = () => {
      if (editor.state.selection.empty) { setCoords(null); return; }
      const sel = window.getSelection();
      if (!sel?.rangeCount) { setCoords(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setCoords({ top: rect.top - 44, left: rect.left + rect.width / 2 });
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
      style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateX(-50%)", zIndex: 50 }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
    >
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1">
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
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
      </ToolbarButton>
    </div>,
    document.body,
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
        "flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}
