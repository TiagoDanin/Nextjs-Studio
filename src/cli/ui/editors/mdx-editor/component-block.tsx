"use client";

/**
 * @context  UI editor — component block node at src/cli/ui/editors/mdx-editor/component-block.tsx
 * @does     TipTap custom node that renders component blocks as editable cards in the editor
 * @depends  @tiptap/core, @tiptap/react
 * @do       Add visual customization or component preview rendering here
 * @dont     Put props editing UI here — that belongs in component-props-panel.tsx
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { Box } from "lucide-react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";

function ComponentBlockView({ node, updateAttributes }: NodeViewProps) {
  const tagName = (node.attrs as Record<string, string>).tagName ?? "Component";
  const setSelectedComponent = useMdxEditorStore((s) => s.setSelectedComponent);

  return (
    <NodeViewWrapper className="my-2">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 transition-colors hover:border-foreground/20"
        onClick={() => setSelectedComponent?.({ tagName, attrs: node.attrs as Record<string, unknown> })}
        contentEditable={false}
      >
        <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          &lt;{tagName} /&gt;
        </span>
        <span className="ml-auto text-xs text-muted-foreground/50">
          Click to edit props
        </span>
      </div>
    </NodeViewWrapper>
  );
}

export const ComponentBlock = Node.create({
  name: "componentBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      tagName: { default: "Component" },
      props: { default: {} },
    };
  },

  parseHTML() {
    return [{ tag: "component-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["component-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ComponentBlockView);
  },
});
