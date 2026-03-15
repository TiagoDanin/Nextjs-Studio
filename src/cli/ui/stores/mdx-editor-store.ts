"use client";

/**
 * @context  Zustand store for the MDX editor (cli/ui/stores).
 * @does     Holds frontmatter, body, rendered HTML, and dirty state for a single MDX entry being edited.
 * @depends  zustand; no other project-internal dependencies.
 * @do       Add MDX-specific editor state (e.g. cursor position, selection) here.
 * @dont     Never perform file I/O or network requests inside the store — use server actions.
 */

import { create } from "zustand";

interface MdxEditorState {
  isDirty: boolean;
  collectionName: string;
  slug: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  renderedHtml: string;

  init: (
    collectionName: string,
    slug: string,
    filePath: string,
    frontmatter: Record<string, unknown>,
    body: string,
  ) => void;
  updateFrontmatter: (key: string, value: unknown) => void;
  updateBody: (body: string) => void;
  updateRenderedHtml: (html: string) => void;
  markClean: () => void;
}

export const useMdxEditorStore = create<MdxEditorState>((set) => ({
  isDirty: false,
  collectionName: "",
  slug: "",
  filePath: "",
  frontmatter: {},
  body: "",
  renderedHtml: "",

  init: (collectionName, slug, filePath, frontmatter, body) =>
    set({ collectionName, slug, filePath, frontmatter, body, isDirty: false }),

  updateFrontmatter: (key, value) =>
    set((state) => ({
      frontmatter: { ...state.frontmatter, [key]: value },
      isDirty: true,
    })),

  updateBody: (body) => set({ body, isDirty: true }),

  updateRenderedHtml: (html) => set({ renderedHtml: html }),

  markClean: () => set({ isDirty: false }),
}));
