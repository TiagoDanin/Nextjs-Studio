"use client";

/**
 * @context  UI editor — code block node view at src/cli/ui/editors/mdx-editor/code-block-view.tsx
 * @does     Custom NodeView for CodeBlockLowlight with a language selector dropdown
 * @depends  @tiptap/react, lowlight
 * @do       Add more language options as needed
 * @dont     Put general editor config here — that belongs in mdx-tiptap.tsx
 */

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";

const LANGUAGES = [
  { value: "", label: "None" },
  { value: "bash", label: "Bash" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "diff", label: "Diff" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "html", label: "HTML" },
  { value: "ini", label: "INI" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "lua", label: "Lua" },
  { value: "makefile", label: "Makefile" },
  { value: "markdown", label: "Markdown" },
  { value: "objectivec", label: "Objective-C" },
  { value: "perl", label: "Perl" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "r", label: "R" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "shell", label: "Shell" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

export function CodeBlockView({ node, updateAttributes, extension }: NodeViewProps) {
  const language = (node.attrs as Record<string, string>).language ?? "";

  return (
    <NodeViewWrapper className="relative my-2">
      <div className="absolute right-2 top-2 z-10" contentEditable={false}>
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="h-6 rounded border border-border bg-muted/80 px-1.5 text-[10px] font-medium text-muted-foreground outline-none backdrop-blur-sm hover:bg-muted"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <pre>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
