"use client";

import { create } from "zustand";
import { orderBy } from "lodash-es";

interface EditorState {
  // Shared
  isDirty: boolean;
  isSaving: boolean;
  collectionName: string;
  filePath: string;
  editorType: "sheet" | "form" | null;

  // Sheet state
  rows: Record<string, unknown>[];
  selectedRowIndex: number | null;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";

  // MDX per-row sources (parallel to rows[])
  isMdx: boolean;
  rowFilePaths: string[];
  rowBodies: string[];

  // Form state
  formData: Record<string, unknown>;
  expandedSections: string[];

  // Init
  initSheet: (
    collectionName: string,
    filePath: string,
    rows: Record<string, unknown>[],
    mdxSources?: { filePath: string; body: string }[],
  ) => void;
  initForm: (
    collectionName: string,
    filePath: string,
    data: Record<string, unknown>,
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

  rows: [],
  selectedRowIndex: null,
  sortColumn: null,
  sortDirection: "asc",

  isMdx: false,
  rowFilePaths: [],
  rowBodies: [],

  formData: {},
  expandedSections: [],

  initSheet: (collectionName, filePath, rows, mdxSources) =>
    set({
      editorType: "sheet",
      collectionName,
      filePath,
      rows,
      isMdx: !!mdxSources,
      rowFilePaths: mdxSources?.map((s) => s.filePath) ?? [],
      rowBodies: mdxSources?.map((s) => s.body) ?? [],
      isDirty: false,
      isSaving: false,
      selectedRowIndex: null,
      sortColumn: null,
      sortDirection: "asc",
    }),

  initForm: (collectionName, filePath, data) => {
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
      }));
      const sorted = orderBy(combined, [(c) => c.row[column]], [direction]);
      return {
        rows: sorted.map((c) => c.row),
        rowFilePaths: sorted.map((c) => c.filePath),
        rowBodies: sorted.map((c) => c.body),
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
