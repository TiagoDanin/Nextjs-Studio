"use client";

/**
 * @context  Global command palette at src/cli/ui/components/command-palette.tsx
 * @does     Cmd/Ctrl+K opens a fuzzy-searchable navigator over collections and entries
 * @depends  next/navigation, lib/sidebar-cache for the cached collection list
 * @do       Add new commands (create entry, run sync) here as palette items
 * @dont     Fetch data from the server here — read from the client-side sidebar cache only
 */

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, FileText, Table, FileJson, ArrowRight } from "lucide-react";
import { readSidebarCache, type CachedCollection } from "@/lib/sidebar-cache";

type Item = {
  label: string;
  hint?: string;
  href: string;
  type: "mdx" | "json-array" | "json-object";
};

const typeIcons = {
  mdx: FileText,
  "json-array": Table,
  "json-object": FileJson,
} as const;

function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 10 + (t.startsWith(q) ? 5 : 0);
  // simple subsequence match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [collections, setCollections] = useState<CachedCollection[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setCollections(readSidebarCache());
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = collections.map((c) => ({
      label: c.name,
      hint: c.type,
      href: `/collection/${c.name}`,
      type: c.type,
    }));
    if (!query) return all;
    return all
      .map((item) => ({ item, score: fuzzyScore(query, item.label) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
  }, [collections, query]);

  const go = (item: Item) => {
    router.push(item.href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = items[active];
      if (target) go(target);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search collections…"
            className="flex-1 bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No matches.
            </p>
          )}
          {items.map((item, i) => {
            const Icon = typeIcons[item.type];
            const isActive = i === active;
            return (
              <button
                key={item.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-accent" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate capitalize">{item.label}</span>
                {item.hint && (
                  <span className="text-[10px] text-muted-foreground">{item.hint}</span>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t px-3 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ navigate · ↵ open</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
