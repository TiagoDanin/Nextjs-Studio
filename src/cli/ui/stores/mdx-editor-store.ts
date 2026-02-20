"use client";

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
