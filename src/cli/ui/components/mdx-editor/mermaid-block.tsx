"use client";

import { useEffect, useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Node view — renders mermaid code + live SVG preview
// ---------------------------------------------------------------------------

function MermaidNodeView({ node }: NodeViewProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const code = node.textContent.trim();
    if (!code) {
      setSvg("");
      setError("");
      return;
    }

    let cancelled = false;

    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });

      mermaid
        .render(idRef.current, code)
        .then(({ svg }) => {
          if (!cancelled) {
            setSvg(svg);
            setError("");
            // Rotate the id so next render doesn't collide
            idRef.current = `mermaid-${Math.random().toString(36).slice(2)}`;
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : String(err));
            setSvg("");
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [node.textContent]);

  return (
    <NodeViewWrapper className="my-4 rounded-xl border bg-muted/40">
      {/* Editable code area */}
      <div className="relative px-4 pt-3 pb-2">
        <span className="absolute right-3 top-2 select-none text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          mermaid
        </span>
        <NodeViewContent
          as="div"
          className="font-mono text-sm leading-relaxed text-foreground outline-none"
        />
      </div>

      {/* Live preview */}
      <div
        className={cn(
          "border-t px-4 py-4",
          error && "bg-destructive/5",
        )}
        contentEditable={false}
      >
        {svg && (
          <div
            className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            // mermaid returns sanitised SVG — safe to set as innerHTML
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
        {error && (
          <pre className="text-xs text-destructive whitespace-pre-wrap">
            {error}
          </pre>
        )}
        {!svg && !error && (
          <p className="text-center text-xs text-muted-foreground">
            Start typing a diagram…
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ---------------------------------------------------------------------------
// TipTap node definition
// ---------------------------------------------------------------------------

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      { tag: 'pre[data-type="mermaid"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(HTMLAttributes, { "data-type": "mermaid" }),
      ["code", 0],
    ];
  },

  // Teach tiptap-markdown how to serialize this node.
  // Serializes to GitHub-flavoured fenced code blocks:
  //   ```mermaid
  //   flowchart LR
  //       A --> B
  //   ```
  // Parsing is handled by the appendTransaction plugin below, which converts
  // any codeBlock node with language="mermaid" into a mermaidBlock node.
  addStorage() {
    return {
      markdown: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          state.write("```mermaid\n");
          state.text(node.textContent, false);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        // After any transaction that changes the document, scan for codeBlock
        // nodes with language "mermaid" (created by CodeBlockLowlight when
        // loading markdown) and replace them with mermaidBlock nodes.
        // Collect positions first, then process bottom-up to avoid position drift.
        appendTransaction(_transactions, _oldState, newState) {
          const { schema, doc, tr } = newState;
          const mermaidType = schema.nodes.mermaidBlock;
          if (!mermaidType) return null;

          const toConvert: Array<{ from: number; to: number; content: import("@tiptap/pm/model").Fragment }> = [];

          doc.descendants((node, pos) => {
            if (
              node.type.name === "codeBlock" &&
              node.attrs.language === "mermaid"
            ) {
              toConvert.push({ from: pos, to: pos + node.nodeSize, content: node.content });
            }
          });

          if (toConvert.length === 0) return null;

          // Process bottom-up so earlier positions stay valid
          for (let i = toConvert.length - 1; i >= 0; i--) {
            const { from, to, content } = toConvert[i]!;
            tr.replaceWith(from, to, mermaidType.create(null, content));
          }

          return tr;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Exit the block with Mod-Enter
      "Mod-Enter": () =>
        this.editor.commands.insertContentAt(
          this.editor.state.selection.to + 1,
          { type: "paragraph" },
        ),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});
