"use client";

import { useEffect } from "react";
import { writeSidebarCache, type CachedCollection } from "@/lib/utils";

export type { CachedCollection } from "@/lib/utils";
export { readSidebarCache } from "@/lib/utils";

/** Writes the current collections list to localStorage whenever it changes. */
export function SidebarCacheWriter({
  collections,
}: {
  collections: CachedCollection[];
}) {
  useEffect(() => {
    writeSidebarCache(collections);
  }, [collections]);

  return null;
}
