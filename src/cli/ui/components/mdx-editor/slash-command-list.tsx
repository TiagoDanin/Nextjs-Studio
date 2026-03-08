"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  GitBranch,
  Image,
  FileVideo,
  FileAudio,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlashCommandItem {
  title: string;
  description: string;
  command: (editor: unknown, range: unknown) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "Heading 1": <Heading1 className="h-[15px] w-[15px]" />,
  "Heading 2": <Heading2 className="h-[15px] w-[15px]" />,
  "Heading 3": <Heading3 className="h-[15px] w-[15px]" />,
  "Bullet List": <List className="h-[15px] w-[15px]" />,
  "Ordered List": <ListOrdered className="h-[15px] w-[15px]" />,
  "Blockquote": <Quote className="h-[15px] w-[15px]" />,
  "Code Block": <Code2 className="h-[15px] w-[15px]" />,
  "Divider": <Minus className="h-[15px] w-[15px]" />,
  "Mermaid Diagram": <GitBranch className="h-[15px] w-[15px]" />,
  "Image": <Image className="h-[15px] w-[15px]" />,
  "Video": <FileVideo className="h-[15px] w-[15px]" />,
  "Audio": <FileAudio className="h-[15px] w-[15px]" />,
};

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
            const icon = ICON_MAP[item.title];
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
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-none">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
SlashCommandList.displayName = "SlashCommandList";
