"use client";

/**
 * @context  UI editor — rich text field at src/cli/ui/editors/json-form/rich-text-field.tsx
 * @does     Provides a TipTap-based rich text editor for long-text fields in the JSON form
 * @depends  @tiptap/react, ../mdx-editor/editor-actions for BLOCK_ACTIONS
 * @do       Add field-specific toolbar buttons or extensions here
 * @dont     Put form layout logic here — this is a standalone field component
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { createLowlight, common } from "lowlight";
import { Markdown } from "tiptap-markdown";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOCK_ACTIONS } from "../mdx-editor/editor-actions";

const lowlight = createLowlight(common);

interface Props {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

function Btn({
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

function Sep() {
  return <div className="mx-1.5 h-4.5 w-px shrink-0 bg-border" />;
}

function RichTextToolbar({ editor }: { editor: Editor }) {
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

  const headingActions = BLOCK_ACTIONS.filter((action) => action.toolbarExec && action.isActive);

  return (
    <div className="flex items-center gap-px rounded-t-md border border-b-0 bg-card px-2 py-1">
      <Btn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
        <Undo className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
        <Redo className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph") && !editor.isActive("heading")}
        title="Normal text"
      >
        <Type className="h-3.5 w-3.5" />
      </Btn>
      {headingActions.map((action) => (
        <Btn
          key={action.title}
          onClick={() => action.toolbarExec!(editor)}
          active={action.isActive!(editor)}
          title={action.title}
        >
          {action.icon}
        </Btn>
      ))}

      <Sep />

      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <Code className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn onClick={setLink} active={editor.isActive("link")} title="Link">
        <LinkIcon className="h-3.5 w-3.5" />
      </Btn>
    </div>
  );
}

export function RichTextField({ value, onChange, placeholder }: Props) {
  const isInternalUpdate = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleUpdate = useCallback(
    (md: string) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        isInternalUpdate.current = true;
        onChange(md);
      }, 150);
    },
    [onChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
      Markdown.configure({ transformPastedText: true }),
    ],
    content: value,
    onUpdate({ editor }) {
      const md = (
        editor.storage as unknown as { markdown: { getMarkdown(): string } }
      ).markdown.getMarkdown();
      handleUpdate(md);
    },
  });

  // Sync external value changes (e.g. undo from store)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const currentMd = (
      editor.storage as unknown as { markdown: { getMarkdown(): string } }
    ).markdown.getMarkdown();
    if (currentMd !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div className="rich-text-field overflow-hidden rounded-md border">
      {editor && <RichTextToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="px-4 py-3 [&_.tiptap]:min-h-50 [&_.tiptap]:outline-none"
      />
    </div>
  );
}
