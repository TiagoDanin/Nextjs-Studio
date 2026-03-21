"use client";

/**
 * @context  Zustand store for the JSON sheet and form editors (cli/ui/stores).
 * @does     Manages rows, form data, sorting, dirty state, and serialization for both sheet and form editor modes.
 * @depends  zustand, lodash-es, @shared/fields for FieldDefinition types.
 * @do       Add new editor actions (e.g. undo/redo, bulk edit) that mutate sheet or form state.
 * @dont     Never perform I/O (fetch, file access) inside the store — delegate to server actions.
 */

import { create } from "zustand";
import { orderBy } from "lodash-es";
import type { FieldDefinition } from "@shared/fields";
import { resolveDefault } from "@/lib/field-helpers";

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
  /** Column names explicitly visible (when user has customized visibility). */
  visibleColumns: Set<string>;
  /** Whether the user has customized column visibility for this collection. */
  hasCustomVisibility: boolean;

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

  // Tree actions
  deleteField: (path: string) => void;
  reorderField: (path: string, direction: "up" | "down") => void;

  // Column visibility
  toggleColumnVisibility: (column: string) => void;
  resetColumnVisibility: () => void;
  isColumnVisible: (column: string, allColumns: string[]) => boolean;

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
  visibleColumns: new Set<string>(),
  hasCustomVisibility: false,

  isMdx: false,
  rowFilePaths: [],
  rowBodies: [],
  rowSlugs: [],

  formData: {},
  expandedSections: [],

  initSheet: (collectionName, filePath, rows, mdxSources, fields) => {
    // Restore persisted column visibility from localStorage
    let visibleColumns = new Set<string>();
    let hasCustomVisibility = false;
    try {
      const stored = localStorage.getItem(`studio:columns:${collectionName}`);
      if (stored) {
        visibleColumns = new Set(JSON.parse(stored) as string[]);
        hasCustomVisibility = true;
      }
    } catch { /* ignore */ }

    // Merge schema defaults into each row for fields that are missing
    let mergedRows = rows;
    if (fields && fields.length > 0) {
      mergedRows = rows.map((row) => {
        const merged = { ...row };
        for (const field of fields) {
          if (!(field.name in merged) || merged[field.name] === undefined) {
            merged[field.name] = resolveDefault(field);
          }
        }
        return merged;
      });
    }

    set({
      editorType: "sheet",
      collectionName,
      filePath,
      rows: mergedRows,
      isMdx: !!mdxSources,
      rowFilePaths: mdxSources?.map((source) => source.filePath) ?? [],
      rowBodies: mdxSources?.map((source) => source.body) ?? [],
      rowSlugs: mdxSources?.map((source) => source.slug) ?? [],
      isDirty: false,
      isSaving: false,
      selectedRowIndex: null,
      sortColumn: null,
      sortDirection: "asc",
      fieldDefs: Object.fromEntries((fields ?? []).map((field) => [field.name, field])),
      visibleColumns,
      hasCustomVisibility,
    });
  },

  initForm: (collectionName, filePath, data, fields) => {
    // Merge schema defaults for fields missing from the JSON data (appended at end to preserve JSON order)
    let mergedData = data;
    if (fields && fields.length > 0) {
      mergedData = { ...data };
      for (const field of fields) {
        if (!(field.name in mergedData) || mergedData[field.name] === undefined) {
          mergedData[field.name] = resolveDefault(field);
        }
      }
    }
    const sections = Object.entries(mergedData)
      .filter(
        ([, value]) => typeof value === "object" && value !== null && !Array.isArray(value),
      )
      .map(([key]) => key);
    set({
      editorType: "form",
      collectionName,
      filePath,
      formData: mergedData,
      expandedSections: sections,
      isDirty: false,
      isSaving: false,
      fieldDefs: Object.fromEntries((fields ?? []).map((field) => [field.name, field])),
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
      // Use schema defaults when available
      const defs = Object.values(state.fieldDefs);
      if (defs.length > 0) {
        for (const field of defs) {
          template[field.name] = resolveDefault(field);
        }
      } else if (state.rows.length > 0) {
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
      rows: state.rows.filter((_, index) => index !== rowIndex),
      rowFilePaths: state.rowFilePaths.filter((_, index) => index !== rowIndex),
      rowBodies: state.rowBodies.filter((_, index) => index !== rowIndex),
      rowSlugs: state.rowSlugs.filter((_, index) => index !== rowIndex),
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
      const combined = state.rows.map((row, index) => ({
        row,
        filePath: state.rowFilePaths[index] ?? "",
        body: state.rowBodies[index] ?? "",
        slug: state.rowSlugs[index] ?? "",
      }));
      const sorted = orderBy(combined, [(item) => item.row[column]], [direction]);
      return {
        rows: sorted.map((item) => item.row),
        rowFilePaths: sorted.map((item) => item.filePath),
        rowBodies: sorted.map((item) => item.body),
        rowSlugs: sorted.map((item) => item.slug),
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
        for (const segment of keys) {
          obj = obj[segment] as Record<string, unknown>;
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
        ? state.expandedSections.filter((item) => item !== section)
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
        const value = entries[i]![1];
        const isObj = typeof value === "object" && value !== null && !Array.isArray(value);
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
          ? block.some((idx) => {
              const value = entries[idx]![1];
              return !(typeof value === "object" && value !== null && !Array.isArray(value));
            })
          : block.some((idx) => entries[idx]![0] === key),
      );
      if (blockIdx === -1) return {};
      const swapIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
      if (swapIdx < 0 || swapIdx >= blocks.length) return {};

      const next = [...blocks];
      [next[blockIdx], next[swapIdx]] = [next[swapIdx]!, next[blockIdx]!];
      return {
        formData: Object.fromEntries(next.flat().map((entryIndex) => entries[entryIndex]!)),
        isDirty: true,
      };
    }),

  deleteField: (fieldPath) =>
    set((state) => {
      const data = structuredClone(state.formData);
      const keys = fieldPath.split(".");
      const lastKey = keys.pop()!;
      let obj: Record<string, unknown> = data;
      for (const segment of keys) {
        if (typeof obj[segment] !== "object" || obj[segment] === null) return {};
        obj = obj[segment] as Record<string, unknown>;
      }
      delete obj[lastKey];
      return { formData: data, isDirty: true };
    }),

  reorderField: (fieldPath, direction) =>
    set((state) => {
      const data = structuredClone(state.formData);
      const keys = fieldPath.split(".");
      const lastKey = keys.pop()!;
      let parent: Record<string, unknown> = data;
      for (const segment of keys) {
        if (typeof parent[segment] !== "object" || parent[segment] === null) return {};
        parent = parent[segment] as Record<string, unknown>;
      }
      const entries = Object.entries(parent);
      const idx = entries.findIndex(([k]) => k === lastKey);
      if (idx === -1) return {};
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= entries.length) return {};
      [entries[idx], entries[swapIdx]] = [entries[swapIdx]!, entries[idx]!];

      // Rebuild parent object in the new order
      const reordered = Object.fromEntries(entries);
      if (keys.length === 0) {
        return { formData: reordered, isDirty: true };
      }
      // Reassign to the nested parent
      let root: Record<string, unknown> = data;
      for (let i = 0; i < keys.length - 1; i++) {
        root = root[keys[i]!] as Record<string, unknown>;
      }
      root[keys[keys.length - 1]!] = reordered;
      return { formData: data, isDirty: true };
    }),

  toggleColumnVisibility: (column) =>
    set((state) => {
      // On first toggle, seed visibleColumns from the current default (first 5)
      if (!state.hasCustomVisibility) {
        const allKeys = new Set<string>();
        for (const row of state.rows) {
          for (const key of Object.keys(row)) allKeys.add(key);
        }
        const allArr = Array.from(allKeys);
        const visible = new Set(allArr.slice(0, 5));
        // Toggle the clicked column
        if (visible.has(column)) visible.delete(column);
        else visible.add(column);
        try {
          localStorage.setItem(
            `studio:columns:${state.collectionName}`,
            JSON.stringify([...visible]),
          );
        } catch { /* ignore */ }
        return { visibleColumns: visible, hasCustomVisibility: true };
      }

      const next = new Set(state.visibleColumns);
      if (next.has(column)) next.delete(column);
      else next.add(column);
      try {
        localStorage.setItem(
          `studio:columns:${state.collectionName}`,
          JSON.stringify([...next]),
        );
      } catch { /* ignore */ }
      return { visibleColumns: next };
    }),

  resetColumnVisibility: () =>
    set((state) => {
      try {
        localStorage.removeItem(`studio:columns:${state.collectionName}`);
      } catch { /* ignore */ }
      return { visibleColumns: new Set<string>(), hasCustomVisibility: false };
    }),

  isColumnVisible: (column, allColumns) => {
    const state = get();
    if (!state.hasCustomVisibility) {
      const idx = allColumns.indexOf(column);
      return idx >= 0 && idx < 5;
    }
    return state.visibleColumns.has(column);
  },

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
    return state.rows.map((row, index) => ({
      filePath: state.rowFilePaths[index] ?? "",
      frontmatter: row,
      body: state.rowBodies[index] ?? "",
    }));
  },
}));
