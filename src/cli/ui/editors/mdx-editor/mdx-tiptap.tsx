"use client";

/**
 * @context  UI editor — TipTap instance at src/cli/ui/editors/mdx-editor/mdx-tiptap.tsx
 * @does     Creates and configures the TipTap editor with all extensions for MDX editing
 * @depends  @/stores/mdx-editor-store, @/services/media-api, ./toolbar, ./slash-command, ./mermaid-block
 * @do       Add new TipTap extensions or editor configuration here
 * @dont     Put toolbar UI or visual components here — those belong in toolbar.tsx
 */

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import { createLowlight, common } from "lowlight";
import { Markdown } from "tiptap-markdown";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import type { Editor } from "@tiptap/core";
import type { Fragment } from "@tiptap/pm/model";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { uploadMediaFile } from "@/services/media-api";
import { SlashCommand } from "./slash-command";
import { MermaidBlock } from "./mermaid-block";
import { FixedToolbar, BubbleToolbar, insertAssetInEditor } from "./toolbar";

const lowlight = createLowlight(common);

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const AUDIO_MIME_TYPES = ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac", "audio/flac"];
const ALL_MEDIA_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES];

function convertMermaidCodeBlocks(editor: Editor) {
  const { state } = editor;
  const mermaidType = state.schema.nodes.mermaidBlock;
  if (!mermaidType) return;

  const toConvert: Array<{ from: number; to: number; content: Fragment }> = [];
  state.doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock" && node.attrs.language === "mermaid") {
      toConvert.push({ from: pos, to: pos + node.nodeSize, content: node.content });
    }
  });

  if (toConvert.length === 0) return;

  const tr = state.tr;
  for (let i = toConvert.length - 1; i >= 0; i--) {
    const { from, to, content } = toConvert[i]!;
    tr.replaceWith(from, to, mermaidType.create(null, content));
  }
  editor.view.dispatch(tr);
}

export function MdxTiptap() {
  const slug = useMdxEditorStore((s) => s.slug);
  const updateBody = useMdxEditorStore((s) => s.updateBody);
  const updateRenderedHtml = useMdxEditorStore((s) => s.updateRenderedHtml);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing, or type "/" for commands…' }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
      FileHandler.configure({
        allowedMimeTypes: ALL_MEDIA_TYPES,
        onDrop(editor, files) {
          const collection = useMdxEditorStore.getState().collectionName;
          for (const file of files) {
            uploadMediaFile(file, collection).then((asset) => {
              if (!asset) return;
              insertAssetInEditor(editor, asset.url, asset.name, asset.mimeType);
            });
          }
        },
        onPaste(editor, files) {
          const collection = useMdxEditorStore.getState().collectionName;
          for (const file of files) {
            uploadMediaFile(file, collection).then((asset) => {
              if (!asset) return;
              insertAssetInEditor(editor, asset.url, asset.name, asset.mimeType);
            });
          }
        },
      }),
      Markdown.configure({ transformPastedText: true }),
      GlobalDragHandle,
      MermaidBlock,
      SlashCommand,
    ],
    content: useMdxEditorStore.getState().body,
    onCreate({ editor }) {
      convertMermaidCodeBlocks(editor);
    },
    onUpdate({ editor }) {
      updateBody((editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown());
      updateRenderedHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(useMdxEditorStore.getState().body);
      convertMermaidCodeBlocks(editor);
    }
  }, [slug, editor]);

  return (
    <div className="flex flex-col">
      {editor && <FixedToolbar editor={editor} />}
      {editor && <BubbleToolbar editor={editor} />}
      <EditorContent editor={editor} className="px-6 py-8 md:px-8 [&_.tiptap]:min-h-[65vh]" />
    </div>
  );
}
