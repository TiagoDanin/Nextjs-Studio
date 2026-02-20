"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

export interface SlashCommandItem {
  title: string;
  description: string;
  command: (editor: unknown, range: unknown) => void;
}

interface Props {
  items: SlashCommandItem[];
  onSelect: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<unknown, Props>(
  ({ items, onSelect }, ref) => {
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
        <div className="z-50 w-56 rounded-md border bg-popover p-2 shadow-md">
          <p className="text-sm text-muted-foreground">No results</p>
        </div>
      );
    }

    return (
      <div className="z-50 w-64 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
        {items.map((item, index) => (
          <button
            key={item.title}
            className={`flex w-full flex-col rounded-sm px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground ${
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
            onClick={() => onSelect(item)}
          >
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    );
  },
);
SlashCommandList.displayName = "SlashCommandList";
