"use client";

/**
 * @context  Zustand store for the MDX editor (cli/ui/stores).
 * @does     Holds frontmatter, body, rendered HTML, and dirty state for a single MDX entry being edited.
 * @depends  zustand; no other project-internal dependencies.
 * @do       Add MDX-specific editor state (e.g. cursor position, selection) here.
 * @dont     Never perform file I/O or network requests inside the store — use server actions.
 */

import { create } from "zustand";
import type { FieldDefinition } from "@shared/fields";
import { resolveDefault } from "@/lib/field-helpers";

interface SelectedComponent {
  tagName: string;
  props: Record<string, unknown>;
  /** Callback to update TipTap node attributes when props change */
  updateAttributes?: (attrs: Record<string, unknown>) => void;
}

interface MdxEditorState {
  isDirty: boolean;
  collectionName: string;
  slug: string;
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  renderedHtml: string;
  selectedComponent: SelectedComponent | null;

  init: (
    collectionName: string,
    slug: string,
    filePath: string,
    frontmatter: Record<string, unknown>,
    body: string,
    fields?: FieldDefinition[],
  ) => void;
  updateFrontmatter: (key: string, value: unknown) => void;
  updateBody: (body: string) => void;
  updateRenderedHtml: (html: string) => void;
  setSelectedComponent: (component: SelectedComponent | null) => void;
  updateComponentProp: (key: string, value: unknown) => void;
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
  selectedComponent: null,

  init: (collectionName, slug, filePath, frontmatter, body, fields) => {
    // Merge schema defaults for fields that don't exist in the frontmatter
    let merged = frontmatter;
    if (fields && fields.length > 0) {
      merged = { ...frontmatter };
      for (const field of fields) {
        if (!(field.name in merged) || merged[field.name] === undefined) {
          merged[field.name] = resolveDefault(field);
        }
      }
    }
    set({ collectionName, slug, filePath, frontmatter: merged, body, isDirty: false, selectedComponent: null });
  },

  updateFrontmatter: (key, value) =>
    set((state) => ({
      frontmatter: { ...state.frontmatter, [key]: value },
      isDirty: true,
    })),

  updateBody: (body) => set({ body, isDirty: true }),

  updateRenderedHtml: (html) => set({ renderedHtml: html }),

  setSelectedComponent: (component) => set({ selectedComponent: component }),

  updateComponentProp: (key, value) =>
    set((state) => {
      if (!state.selectedComponent) return state;
      const newProps = { ...state.selectedComponent.props, [key]: value };
      // Sync back to TipTap node
      state.selectedComponent.updateAttributes?.({ props: newProps });
      return {
        selectedComponent: { ...state.selectedComponent, props: newProps },
        isDirty: true,
      };
    }),

  markClean: () => set({ isDirty: false }),
}));
