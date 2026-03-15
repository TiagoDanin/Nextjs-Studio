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

  openPicker: (
    insertType: "image" | "video" | "audio" | "any",
    onInsert: (url: string, name: string, mimeType: string) => void,
  ) => void;
  closePicker: () => void;
}

export const useMediaStore = create<MediaPickerState>((set) => ({
  open: false,
  insertType: "any",
  onInsert: null,

  openPicker: (insertType, onInsert) => set({ open: true, insertType, onInsert }),
  closePicker: () => set({ open: false, onInsert: null }),
}));
