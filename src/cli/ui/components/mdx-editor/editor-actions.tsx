"use client";

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

const sz = "h-3.5 w-3.5";

export const BLOCK_ACTIONS: EditorAction[] = [
  {
    title: "Heading 1",
    description: "Large heading",
    icon: <Heading1 className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
    toolbarExec: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive("heading", { level: 1 }),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: <Heading2 className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
    toolbarExec: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: <Heading3 className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
    toolbarExec: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive("heading", { level: 3 }),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: "Ordered List",
    description: "Numbered list",
    icon: <ListOrdered className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: "Blockquote",
    description: "Quote block",
    icon: <Quote className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlight",
    icon: <Code2 className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className={sz} />,
    slashExec: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  {
    title: "Mermaid Diagram",
    description: "Flowchart, sequence, or graph",
    icon: <GitBranch className={sz} />,
    slashExec: (e, r) =>
      e.chain().focus().deleteRange(r).insertContent({ type: "mermaidBlock", content: [] }).run(),
  },
  {
    title: "Image",
    description: "Insert an image from media",
    icon: <Image className={sz} />,
    slashExec: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      useMediaStore.getState().openPicker("image", (url, name) => {
        e.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Video",
    description: "Insert a video from media",
    icon: <FileVideo className={sz} />,
    slashExec: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      useMediaStore.getState().openPicker("video", (url, name) => {
        e.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
  {
    title: "Audio",
    description: "Insert an audio file from media",
    icon: <FileAudio className={sz} />,
    slashExec: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      useMediaStore.getState().openPicker("audio", (url, name) => {
        e.chain().focus().setImage({ src: url, alt: name }).run();
      });
    },
  },
];
