"use client";

/**
 * @context  UI editor — MDX editor wrapper at src/cli/ui/editors/mdx-editor/mdx-editor.tsx
 * @does     Composes the MDX toolbar, frontmatter editor, TipTap editor, and media picker
 * @depends  @/stores/mdx-editor-store, ./mdx-toolbar, ./mdx-frontmatter, ./mdx-tiptap, @/editors/media-picker
 * @do       Add new editor panels (e.g. outline sidebar) as children here
 * @dont     Put editor logic or state management here — delegate to stores and sub-components
 */

import { useEffect } from "react";
import { useMdxEditorStore } from "@/stores/mdx-editor-store";
import { MdxToolbar } from "./mdx-toolbar";
import { MdxFrontmatter } from "./mdx-frontmatter";
import { MdxTiptap } from "./mdx-tiptap";
import { MediaPicker } from "@/editors/media-picker/media-picker";
import { ComponentPropsPanel } from "./component-props-panel";
import type { ComponentDefinition } from "@shared/component-types";

interface Props {
  collectionName: string;
  slug: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  registry?: ComponentDefinition[];
  /** All locale variants for this slug — only present when more than one locale exists. */
  locales?: { locale: string; slug: string }[];
  /** The currently active locale identifier (e.g. "pt" or "default"). */
  currentLocale?: string;
}

export function MdxEditor({
  collectionName,
  slug,
  filePath,
  frontmatter,
  body,
  registry = [],
  locales,
  currentLocale,
}: Props) {
  const init = useMdxEditorStore((s) => s.init);

  useEffect(() => {
    init(collectionName, slug, filePath, frontmatter, body);
  }, [collectionName, slug, filePath, frontmatter, body, init]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <MdxToolbar locales={locales} currentLocale={currentLocale} />
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
      <ComponentPropsPanel registry={registry} />
    </div>
  );
}
