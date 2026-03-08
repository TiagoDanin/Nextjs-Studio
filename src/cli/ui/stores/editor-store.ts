"use client";

import { create } from "zustand";
import { orderBy } from "lodash-es";
import type { FieldDefinition } from "@shared/fields";

interface EditorState {
  // Shared
  isDirty: boolean;
  isSaving: boolean;
  collectionName: string;
  filePath: string;
  editorType: "sheet" | "form" | null;
  /** Field definitions keyed by field name. */
  fieldDefs: Record<string, FieldDefinition>;

  // Sheet state
  rows: Record<string, unknown>[];
  selectedRowIndex: number | null;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";

  // MDX per-row sources (parallel to rows[])
  isMdx: boolean;
  rowFilePaths: string[];
  rowBodies: string[];
  rowSlugs: string[];

  // Form state
  formData: Record<string, unknown>;
  expandedSections: string[];

  // Init
  initSheet: (
    collectionName: string,
    filePath: string,
    rows: Record<string, unknown>[],
    mdxSources?: { slug: string; filePath: string; body: string }[],
    fields?: FieldDefinition[],
  ) => void;
  initForm: (
    collectionName: string,
    filePath: string,
    data: Record<string, unknown>,
    fields?: FieldDefinition[],
  ) => void;

  // Sheet actions
  updateCell: (rowIndex: number, column: string, value: unknown) => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  selectRow: (index: number | null) => void;
  sortBy: (column: string) => void;

  // Form actions
  updateField: (path: string, value: unknown) => void;
  addField: (path: string, key: string, defaultValue: unknown) => void;
  toggleSection: (section: string) => void;
  reorderSection: (key: string, direction: "up" | "down") => void;

  // Shared actions
  markClean: () => void;
  getSerializedJson: () => string;
  getMdxSources: () => { filePath: string; frontmatter: Record<string, unknown>; body: string }[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isDirty: false,
  isSaving: false,
  collectionName: "",
  filePath: "",
  editorType: null,
  fieldDefs: {},

  rows: [],
  selectedRowIndex: null,
  sortColumn: null,
  sortDirection: "asc",

  isMdx: false,
  rowFilePaths: [],
  rowBodies: [],
  rowSlugs: [],

  formData: {},
  expandedSections: [],

  initSheet: (collectionName, filePath, rows, mdxSources, fields) =>
    set({
      editorType: "sheet",
      collectionName,
      filePath,
      rows,
      isMdx: !!mdxSources,
      rowFilePaths: mdxSources?.map((s) => s.filePath) ?? [],
      rowBodies: mdxSources?.map((s) => s.body) ?? [],
      rowSlugs: mdxSources?.map((s) => s.slug) ?? [],
      isDirty: false,
      isSaving: false,
      selectedRowIndex: null,
      sortColumn: null,
      sortDirection: "asc",
      fieldDefs: Object.fromEntries((fields ?? []).map((f) => [f.name, f])),
    }),

  initForm: (collectionName, filePath, data, fields) => {
    const sections = Object.entries(data)
      .filter(
        ([, v]) => typeof v === "object" && v !== null && !Array.isArray(v),
      )
      .map(([k]) => k);
    set({
      editorType: "form",
      collectionName,
      filePath,
      formData: data,
      expandedSections: sections,
      isDirty: false,
      isSaving: false,
      fieldDefs: Object.fromEntries((fields ?? []).map((f) => [f.name, f])),
    });
  },

  updateCell: (rowIndex, column, value) =>
    set((state) => {
      const rows = [...state.rows];
      rows[rowIndex] = { ...rows[rowIndex], [column]: value };
      return { rows, isDirty: true };
    }),

  addRow: () =>
    set((state) => {
      const template: Record<string, unknown> = {};
      if (state.rows.length > 0) {
        for (const key of Object.keys(state.rows[0])) {
          const sample = state.rows[0][key];
          if (typeof sample === "boolean") template[key] = false;
          else if (typeof sample === "number") template[key] = 0;
          else template[key] = "";
        }
      }
      return { rows: [...state.rows, template], isDirty: true };
    }),

  deleteRow: (rowIndex) =>
    set((state) => ({
      rows: state.rows.filter((_, i) => i !== rowIndex),
      rowFilePaths: state.rowFilePaths.filter((_, i) => i !== rowIndex),
      rowBodies: state.rowBodies.filter((_, i) => i !== rowIndex),
      rowSlugs: state.rowSlugs.filter((_, i) => i !== rowIndex),
      selectedRowIndex:
        state.selectedRowIndex === rowIndex ? null : state.selectedRowIndex,
      isDirty: true,
    })),

  selectRow: (index) => set({ selectedRowIndex: index }),

  sortBy: (column) =>
    set((state) => {
      const direction =
        state.sortColumn === column && state.sortDirection === "asc"
          ? "desc"
          : "asc";
      const combined = state.rows.map((row, i) => ({
        row,
        filePath: state.rowFilePaths[i] ?? "",
        body: state.rowBodies[i] ?? "",
        slug: state.rowSlugs[i] ?? "",
      }));
      const sorted = orderBy(combined, [(c) => c.row[column]], [direction]);
      return {
        rows: sorted.map((c) => c.row),
        rowFilePaths: sorted.map((c) => c.filePath),
        rowBodies: sorted.map((c) => c.body),
        rowSlugs: sorted.map((c) => c.slug),
        sortColumn: column,
        sortDirection: direction,
        selectedRowIndex: null,
      };
    }),

  updateField: (path, value) =>
    set((state) => {
      const data = structuredClone(state.formData);
      const keys = path.split(".");
      let obj: Record<string, unknown> = data;
      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof obj[keys[i]] !== "object" || obj[keys[i]] === null) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return { formData: data, isDirty: true };
    }),

  addField: (path, key, defaultValue) =>
    set((state) => {
      const data = structuredClone(state.formData);
      if (path) {
        const keys = path.split(".");
        let obj: Record<string, unknown> = data;
        for (const k of keys) {
          obj = obj[k] as Record<string, unknown>;
        }
        obj[key] = defaultValue;
      } else {
        data[key] = defaultValue;
      }
      return { formData: data, isDirty: true };
    }),

  toggleSection: (section) =>
    set((state) => {
      const expanded = state.expandedSections.includes(section)
        ? state.expandedSections.filter((s) => s !== section)
        : [...state.expandedSections, section];
      return { expandedSections: expanded };
    }),

  reorderSection: (key, direction) =>
    set((state) => {
      const entries = Object.entries(state.formData);

      // Build contiguous blocks: flat entries group together, each object is its own block
      const blocks: number[][] = [];
      let flatAccum: number[] = [];
      for (let i = 0; i < entries.length; i++) {
        const v = entries[i]![1];
        const isObj = typeof v === "object" && v !== null && !Array.isArray(v);
        if (isObj) {
          if (flatAccum.length > 0) { blocks.push(flatAccum); flatAccum = []; }
          blocks.push([i]);
        } else {
          flatAccum.push(i);
        }
      }
      if (flatAccum.length > 0) blocks.push(flatAccum);

      // Find which block corresponds to the given key
      const blockIdx = blocks.findIndex((block) =>
        key === "__flat__"
          ? block.some((i) => {
              const v = entries[i]![1];
              return !(typeof v === "object" && v !== null && !Array.isArray(v));
            })
          : block.some((i) => entries[i]![0] === key),
      );
      if (blockIdx === -1) return {};
      const swapIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
      if (swapIdx < 0 || swapIdx >= blocks.length) return {};

      const next = [...blocks];
      [next[blockIdx], next[swapIdx]] = [next[swapIdx]!, next[blockIdx]!];
      return {
        formData: Object.fromEntries(next.flat().map((i) => entries[i]!)),
        isDirty: true,
      };
    }),

  markClean: () => set({ isDirty: false, isSaving: false }),

  getSerializedJson: () => {
    const state = get();
    if (state.editorType === "sheet") {
      return JSON.stringify(state.rows, null, 2);
    }
    return JSON.stringify(state.formData, null, 2);
  },

  getMdxSources: () => {
    const state = get();
    return state.rows.map((row, i) => ({
      filePath: state.rowFilePaths[i] ?? "",
      frontmatter: row,
      body: state.rowBodies[i] ?? "",
    }));
  },
}));
