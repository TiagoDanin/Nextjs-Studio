"use client";

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { readSidebarCache } from "@/lib/sidebar-cache";

// Widths cycle to give the skeleton items a natural varied look
const FALLBACK_WIDTHS = [72, 56, 88, 64];

/** Sidebar shell rendered during page transitions so the layout never flashes. */
export function AppSidebarSkeleton() {
  const cached = useMemo(() => readSidebarCache(), []);
  const items = cached.length > 0 ? cached : FALLBACK_WIDTHS.map(() => null);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background">
      <div className="flex h-14.5 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
          <Layers className="h-4 w-4 text-sidebar-primary" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-sidebar-foreground">
          Nextjs Studio
        </span>
      </div>

      <div className="flex-1 py-5">
        <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
          Content
        </p>
        <div className="flex flex-col gap-1 px-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2"
            >
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-sidebar-foreground/10" />
              {item ? (
                // Show the actual collection name dimmed
                <span className="truncate text-[13px] capitalize text-sidebar-foreground/20">
                  {item.name}
                </span>
              ) : (
                <div
                  className="h-3 rounded bg-sidebar-foreground/10"
                  style={{ width: FALLBACK_WIDTHS[i % FALLBACK_WIDTHS.length] }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-sidebar-foreground/30">
            v0.1.0
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
