"use client";

import { useEffect } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { MdxToolbar } from "./mdx-toolbar";
import { MdxFrontmatter } from "./mdx-frontmatter";
import { MdxTiptap } from "./mdx-tiptap";

interface Props {
  collectionName: string;
  slug: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function MdxEditor({
  collectionName,
  slug,
  filePath,
  frontmatter,
  body,
}: Props) {
  const init = useMdxEditorStore((s) => s.init);

  useEffect(() => {
    init(collectionName, slug, filePath, frontmatter, body);
  }, [collectionName, slug, filePath, frontmatter, body, init]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MdxToolbar />
      <div className="flex-1 overflow-auto">
        <MdxFrontmatter />
        <MdxTiptap />
      </div>
    </div>
  );
}
