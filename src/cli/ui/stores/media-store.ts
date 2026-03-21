"use client";

/**
 * @context  Zustand store for the media picker modal (cli/ui/stores).
 * @does     Controls open/close state, the filter type (image/video/audio/any), and the insertion callback.
 * @depends  zustand; no other project-internal dependencies.
 * @do       Add media picker state such as search query or view mode here.
 * @dont     Never fetch or upload files inside the store — that belongs in the MediaPicker component.
 */

import { create } from "zustand";

interface MediaPickerState {
  open: boolean;
  insertType: "image" | "video" | "audio" | "any";
  onInsert: ((url: string, name: string, mimeType: string) => void) | null;
  /** Collection name for the media picker — used to fetch/upload assets. */
  collectionName: string;

  openPicker: (
    insertType: "image" | "video" | "audio" | "any",
    onInsert: (url: string, name: string, mimeType: string) => void,
    collectionName?: string,
  ) => void;
  closePicker: () => void;
}

export const useMediaStore = create<MediaPickerState>((set) => ({
  open: false,
  insertType: "any",
  onInsert: null,
  collectionName: "",

  openPicker: (insertType, onInsert, collectionName) =>
    set({
      open: true,
      insertType,
      onInsert,
      ...(collectionName !== undefined ? { collectionName } : {}),
    }),
  closePicker: () => set({ open: false, onInsert: null }),
}));
