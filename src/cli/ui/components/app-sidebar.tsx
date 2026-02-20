import Link from "next/link";
import { FileText, Table, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CollectionItem {
  name: string;
  type: "mdx" | "json-array" | "json-object";
  count: number;
  entries?: { slug: string; title: string }[];
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
      <div className="flex h-14 items-center px-4">
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          Collections
        </h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {collections.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No collections found
            </p>
          )}
          {collections.map((collection) => {
            const Icon = typeIcons[collection.type];
            const isActive = activeCollection === collection.name;
            return (
              <div key={collection.name}>
                <Link
                  href={`/collection/${collection.name}`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive &&
                      !activeSlug &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">
                    {collection.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {collection.count}
                  </span>
                </Link>

                {isActive && collection.entries && collection.entries.length > 0 && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                    {collection.entries.map((entry) => (
                      <Link
                        key={entry.slug}
                        href={`/collection/${collection.name}/${entry.slug}`}
                        className={cn(
                          "truncate rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          activeSlug === entry.slug &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
