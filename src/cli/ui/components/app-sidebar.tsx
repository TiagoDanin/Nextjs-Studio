/**
 * @context  Main sidebar navigation component for the studio UI (cli/ui/components).
 * @does     Renders the collection list with icons, counts, and expandable MDX entry sub-items.
 * @depends  lib/sidebar-cache for persisting collection names, components/theme-toggle, components/ui/scroll-area.
 * @do       Add sidebar features like search filtering or drag-to-reorder collections.
 * @dont     Never fetch data here — receive collections as props from the page server component.
 */

import Link from "next/link";
import { FileText, Table, FileJson, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarCacheWriter } from "@/lib/sidebar-cache";

interface CollectionItem {
  name: string;
  type: "mdx" | "json-array" | "json-object";
  count: number;
  sectionCount?: number;
  entries?: { slug: string; title: string; draft?: boolean }[];
}

const typeIcons = {
  mdx: FileText,
  "json-array": Table,
  "json-object": FileJson,
} as const;

export function AppSidebar({
  collections,
  activeCollection,
  activeSlug,
}: {
  collections: CollectionItem[];
  activeCollection?: string;
  activeSlug?: string;
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background">
      <SidebarCacheWriter collections={collections} />
      <div className="flex h-14.5 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
          <Layers className="h-4 w-4 text-sidebar-primary" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-sidebar-foreground">
        Nextjs Studio
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-5">
          <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
            Content
          </p>

          <nav className="flex flex-col gap-1 px-3">
            {collections.length === 0 && (
              <p className="px-2 py-6 text-xs text-sidebar-foreground/40">
                No collections found
              </p>
            )}

            {collections.map((collection) => {
              const Icon = typeIcons[collection.type];
              const isActive = activeCollection === collection.name;
              const hasSubItems =
                isActive && collection.entries && collection.entries.length > 0;

              return (
                <div key={collection.name}>
                  <Link
                    href={`/collection/${collection.name}`}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors duration-100",
                      "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isActive &&
                        !activeSlug &&
                        "bg-sidebar-accent text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.75 w-3.75 shrink-0 transition-colors",
                        isActive && !activeSlug
                          ? "text-sidebar-foreground"
                          : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70",
                      )}
                    />
                    <span className="flex-1 truncate capitalize">
                      {collection.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                        isActive && !activeSlug
                          ? "bg-sidebar-foreground/10 text-sidebar-foreground/60"
                          : "text-sidebar-foreground/30",
                      )}
                    >
                      {collection.sectionCount ?? collection.count}
                    </span>
                  </Link>

                  {hasSubItems && (
                    <div className="ml-7 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3 pb-1">
                      {collection.entries!.map((entry) => (
                        <Link
                          key={entry.slug}
                          href={`/collection/${collection.name}/${entry.slug}`}
                          className={cn(
                            "truncate rounded-md px-2 py-1.5 text-[12px] transition-colors duration-100",
                            "text-sidebar-foreground/50 hover:text-sidebar-foreground",
                            activeSlug === entry.slug &&
                              "text-sidebar-foreground font-medium",
                            entry.draft && "opacity-50",
                          )}
                        >
                          {entry.title}
                          {entry.draft && (
                            <span className="ml-1.5 text-[10px] text-sidebar-foreground/30">draft</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-sidebar-foreground/30 font-medium">
            v0.1.0
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
