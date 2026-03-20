"use client";

/**
 * @context  UI editor — TipTap instance at src/cli/ui/editors/mdx-editor/mdx-tiptap.tsx
 * @does     Creates and configures the TipTap editor with all extensions for MDX editing
 * @depends  @/stores/mdx-editor-store, @/services/media-api, ./toolbar, ./slash-command, ./mermaid-block
 * @do       Add new TipTap extensions or editor configuration here
 * @dont     Put toolbar UI or visual components here — those belong in toolbar.tsx
 */

import { useEffect } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CodeBlockView } from "./code-block-view";
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
import { ComponentBlock } from "./component-block";
import { FixedToolbar, BubbleToolbar, insertAssetInEditor } from "./toolbar";

const lowlight = createLowlight(common);

/**
 * Converts self-closing JSX components in MDX content to `<component-block>` HTML that TipTap can parse.
 * Example: `<YouTubeEmbed videoId="abc" />` → `<component-block tagname="YouTubeEmbed" data-props='{"videoId":"abc"}'></component-block>`
 */
function preprocessMdxComponents(markdown: string): string {
  // Match self-closing JSX components that start with an uppercase letter
  const COMPONENT_RE = /<([A-Z][a-zA-Z0-9.]*)([^>]*?)\s*\/>/g;
  return markdown.replace(COMPONENT_RE, (_match, tagName: string, propsRaw: string) => {
    const props = parseJsxProps(propsRaw ?? "");
    const dataProps = JSON.stringify(props).replace(/'/g, "&#39;");
    return `<component-block tagname="${tagName}" data-props='${dataProps}'></component-block>`;
  });
}

function parseJsxProps(raw: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const s = raw.trim();
  let i = 0;

  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) break;

    if (!/[a-zA-Z_$]/.test(s[i]!)) { i++; continue; }
    const nameStart = i;
    while (i < s.length && /[a-zA-Z0-9_$]/.test(s[i]!)) i++;
    const key = s.slice(nameStart, i);

    while (i < s.length && /\s/.test(s[i]!)) i++;

    if (i >= s.length || s[i] !== "=") {
      props[key] = true;
      continue;
    }
    i++; // skip '='
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) break;

    const ch = s[i]!;
    if (ch === '"' || ch === "'") {
      i++;
      const start = i;
      while (i < s.length && s[i] !== ch) i++;
      props[key] = s.slice(start, i);
      i++;
    } else if (ch === "{") {
      i++;
      let depth = 1;
      const start = i;
      while (i < s.length && depth > 0) {
        if (s[i] === "{") depth++;
        else if (s[i] === "}") depth--;
        i++;
      }
      const expr = s.slice(start, i - 1);
      try { props[key] = JSON.parse(expr); } catch { props[key] = expr; }
    }
  }

  return props;
}

const frontmatterHighlightKey = new PluginKey("frontmatterHighlight");
const FRONTMATTER_TOKEN = /\{frontmatter\.[a-zA-Z0-9_.]+\}/g;

const FrontmatterHighlight = Extension.create({
  name: "frontmatterHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: frontmatterHighlightKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              let match: RegExpExecArray | null;
              const regex = new RegExp(FRONTMATTER_TOKEN.source, "g");
              while ((match = regex.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    class: "frontmatter-token",
                  }),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

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
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }).configure({ lowlight }),
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
      ComponentBlock,
      SlashCommand,
      FrontmatterHighlight,
    ],
    content: preprocessMdxComponents(useMdxEditorStore.getState().body),
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
      editor.commands.setContent(preprocessMdxComponents(useMdxEditorStore.getState().body));
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
