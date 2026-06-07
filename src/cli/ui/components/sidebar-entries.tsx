"use client";

/**
 * @context  Collapsible sub-item list for an expanded collection in the sidebar (cli/ui/components).
 * @does     Renders the first N entries and a toggle to reveal the rest, keeping the active entry visible.
 * @depends  next/link, lib/utils.
 * @do       Tune the collapse threshold or the expand affordance here.
 * @dont     Fetch data here — entries are passed in from the collection page server component.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarEntry {
  slug: string;
  title: string;
  draft?: boolean;
  locales?: string[];
}

const COLLAPSE_LIMIT = 5;

export function SidebarEntries({
  collectionName,
  entries,
  activeSlug,
}: {
  collectionName: string;
  entries: SidebarEntry[];
  activeSlug?: string;
}) {
  const activeIndex = activeSlug
    ? entries.findIndex((e) => e.slug === activeSlug)
    : -1;
  // Expand by default when the active entry would otherwise be hidden.
  const [expanded, setExpanded] = useState(activeIndex >= COLLAPSE_LIMIT);

  const overflow = entries.length - COLLAPSE_LIMIT;
  const visible = expanded ? entries : entries.slice(0, COLLAPSE_LIMIT);

  return (
    <div className="ml-7 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3 pb-1">
      {visible.map((entry) => (
        <Link
          key={entry.slug}
          href={`/collection/${collectionName}/${entry.slug}`}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] transition-colors duration-100",
            "text-sidebar-foreground/50 hover:text-sidebar-foreground",
            activeSlug === entry.slug && "text-sidebar-foreground font-medium",
            entry.draft && "opacity-50",
          )}
        >
          <span className="truncate">{entry.title}</span>
          {entry.locales && entry.locales.length > 1 && (
            <span className="ml-auto flex shrink-0 gap-0.5">
              {entry.locales.map((l) => (
                <span
                  key={l}
                  className="rounded bg-sidebar-foreground/5 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-sidebar-foreground/40"
                >
                  {l}
                </span>
              ))}
            </span>
          )}
          {entry.draft && (
            <span className="ml-1.5 text-[10px] text-sidebar-foreground/30">draft</span>
          )}
        </Link>
      ))}

      {overflow > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] text-sidebar-foreground/40 transition-colors duration-100 hover:text-sidebar-foreground"
        >
          {expanded ? "Show less" : `… ${overflow} more`}
        </button>
      )}
    </div>
  );
}
