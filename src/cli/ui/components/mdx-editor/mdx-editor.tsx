"use client";

import { useEffect } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { MdxToolbar } from "./mdx-toolbar";
import { MdxFrontmatter } from "./mdx-frontmatter";
import { MdxTiptap } from "./mdx-tiptap";
import { MediaPicker } from "@/components/media-picker/media-picker";

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
      <div className="studio-canvas overflow-y-auto">
        <div className="min-h-full px-4 py-4">
          <div className="studio-surface flex min-h-full flex-col">
            <MdxFrontmatter />
            <MdxTiptap />
          </div>
        </div>
      </div>
      <MediaPicker />
    </div>
  );
}
