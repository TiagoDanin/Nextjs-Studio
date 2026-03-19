"use client";

/**
 * @context  UI component — toast notifications at src/cli/ui/components/ui/toast.tsx
 * @does     Provides a minimal toast notification system via a global store
 * @depends  none (standalone)
 * @do       Add toast variants (success, error, warning) here
 * @dont     Put business logic here — toasts are purely visual
 */

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  variant?: "default" | "success" | "error";
}

let toasts: Toast[] = [];
let listeners: Set<() => void> = new Set();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

function notify() {
  toasts = [...toasts];
  for (const listener of listeners) listener();
}

export function toast(message: string, variant: Toast["variant"] = "default") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, variant }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  function dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2",
            t.variant === "error" && "border-destructive/50 text-destructive",
            t.variant === "success" && "border-green-500/50",
          )}
        >
          <span className="text-sm">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="ml-2 rounded-sm p-0.5 hover:bg-accent"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
