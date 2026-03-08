"use client";

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
