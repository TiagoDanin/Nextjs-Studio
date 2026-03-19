"use client";

/**
 * @context  UI hook — keyboard shortcuts at src/cli/ui/hooks/use-keyboard-shortcuts.ts
 * @does     Registers global Ctrl+S save and Escape handlers
 * @depends  none (generic hook)
 * @do       Add new global shortcuts here
 * @dont     Put editor-specific shortcuts here — use TipTap keymaps for those
 */

import { useEffect } from "react";

interface ShortcutHandlers {
  onSave?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSave, onEscape }: ShortcutHandlers) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
      if (e.key === "Escape") {
        onEscape?.();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, onEscape]);
}
