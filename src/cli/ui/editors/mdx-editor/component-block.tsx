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

function serializePropsToJsx(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}="${value}"`;
      if (typeof value === "boolean") return value ? key : "";
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(" ");
}

function safeParseProps(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return {};
}

function ComponentBlockView({ node, updateAttributes }: NodeViewProps) {
  const tagName = (node.attrs as Record<string, string>).tagName ?? "Component";
  const props = safeParseProps((node.attrs as Record<string, unknown>).props);
  const setSelectedComponent = useMdxEditorStore((s) => s.setSelectedComponent);

  const propsPreview = Object.keys(props).length > 0
    ? Object.entries(props)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(", ")
    : "";

  return (
    <NodeViewWrapper className="my-2">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 transition-colors hover:border-foreground/20"
        onClick={() => setSelectedComponent?.({ tagName, props, updateAttributes })}
        contentEditable={false}
      >
        <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          &lt;{tagName} /&gt;
        </span>
        {propsPreview && (
          <span className="truncate text-xs text-muted-foreground/60">
            {propsPreview}
          </span>
        )}
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
      tagName: {
        default: "Component",
        parseHTML: (element) => element.getAttribute("tagname") ?? "Component",
        renderHTML: (attributes) => ({ tagname: attributes.tagName as string }),
      },
      props: {
        default: {},
        parseHTML: (element) => {
          const raw = element.getAttribute("data-props");
          if (!raw) return {};
          try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
        },
        renderHTML: (attributes) => ({
          "data-props": JSON.stringify(attributes.props ?? {}),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "component-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["component-block", mergeAttributes(HTMLAttributes)];
  },

  addStorage() {
    return {
      markdown: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          const tagName = node.attrs.tagName ?? "Component";
          const props = safeParseProps(node.attrs.props);
          const propsStr = serializePropsToJsx(props);
          const tag = propsStr ? `<${tagName} ${propsStr} />` : `<${tagName} />`;
          state.write(tag);
          state.closeBlock(node);
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ComponentBlockView);
  },
});
