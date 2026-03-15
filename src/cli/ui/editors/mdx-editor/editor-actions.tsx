"use client";

/**
 * @context  UI editor — shared action definitions at src/cli/ui/editors/mdx-editor/editor-actions.tsx
 * @does     Defines block-level editor actions shared by the toolbar and slash command menu
 * @depends  @/stores/media-store for media picker integration
 * @do       Add new block-type actions (e.g. table, callout) as EditorAction entries
 * @dont     Put inline formatting actions here — those live in toolbar.tsx
 */

import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  GitBranch,
  Image,
  FileVideo,
  FileAudio,
} from "lucide-react";
import { useMediaStore } from "@/stores/media-store";

export interface EditorAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Executes when triggered from the slash command (deletes the trigger range first) */
  slashExec: (editor: Editor, range: { from: number; to: number }) => void;
  /** Executes when triggered from the toolbar. Only defined for actions that make sense there. */
  toolbarExec?: (editor: Editor) => void;
  /** Returns whether this action is currently active — used for toolbar button highlight */
  isActive?: (editor: Editor) => boolean;
}

const ICON_SIZE = "h-3.5 w-3.5";

export const BLOCK_ACTIONS: EditorAction[] = [
  {
    title: "Heading 1",
    description: "Large heading",
    icon: <Heading1 className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    toolbarExec: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: <Heading2 className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    toolbarExec: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: <Heading3 className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    toolbarExec: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Ordered List",
    description: "Numbered list",
    icon: <ListOrdered className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Blockquote",
    description: "Quote block",
    icon: <Quote className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlight",
    icon: <Code2 className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className={ICON_SIZE} />,
    slashExec: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Mermaid Diagram",
    description: "Flowchart, sequence, or graph",
    icon: <GitBranch className={ICON_SIZE} />,
    slashExec: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "mermaidBlock", content: [] }).run(),
  },
  {
    title: "Image",
    description: "Insert an image from media",
    icon: <Image className={ICON_SIZE} />,
    slashExec: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("image", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Video",
    description: "Insert a video from media",
    icon: <FileVideo className={ICON_SIZE} />,
    slashExec: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("video", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Audio",
    description: "Insert an audio file from media",
    icon: <FileAudio className={ICON_SIZE} />,
    slashExec: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      useMediaStore.getState().openPicker("audio", (url, name) => {
        editor.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
];
