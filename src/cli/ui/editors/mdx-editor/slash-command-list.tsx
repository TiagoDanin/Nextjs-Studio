"use client";

/**
 * @context  UI editor — slash command dropdown at src/cli/ui/editors/mdx-editor/slash-command-list.tsx
 * @does     Renders the filterable popup list of available editor actions triggered by "/"
 * @depends  ./editor-actions for EditorAction type
 * @do       Improve keyboard navigation or add action categories here
 * @dont     Define actions here — action definitions belong in editor-actions.tsx
 */

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import type { EditorAction } from "./editor-actions";

interface Props {
  items: EditorAction[];
  onSelect: (item: EditorAction) => void;
}

export const SlashCommandList = forwardRef<unknown, Props>(({ items, onSelect }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) onSelect(item);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [items]);

  if (items.length === 0) {
    return (
      <div className="z-50 w-56 overflow-hidden rounded-lg border bg-popover p-2 shadow-lg">
        <p className="text-xs text-muted-foreground">No results</p>
      </div>
    );
  }

  return (
    <div className="z-50 w-64 overflow-hidden rounded-lg border bg-popover p-1.5 shadow-lg">
      <p className="mb-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Insert
      </p>
      <div className="flex flex-col gap-px">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.title}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-accent text-accent-foreground",
              )}
              onClick={() => onSelect(item)}
            >
              <div
                className={cn(
                  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border transition-colors",
                  isSelected
                    ? "border-border bg-background/80 text-foreground"
                    : "border-border bg-background text-foreground/60",
                )}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-none">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
SlashCommandList.displayName = "SlashCommandList";
