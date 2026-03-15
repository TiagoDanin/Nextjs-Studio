"use client";

/**
 * @context  Client-side sidebar cache component in the UI lib layer (cli/ui/lib).
 * @does     Writes the current collections list to localStorage on mount/update so the sidebar skeleton can show cached names.
 * @depends  lib/utils for readSidebarCache/writeSidebarCache helpers.
 * @do       Add cache invalidation or expiration logic if the sidebar cache grows stale.
 * @dont     Never read or write files on disk here — this is a browser-only component.
 */

import { useEffect } from "react";
import { writeSidebarCache, type CachedCollection } from "@/lib/utils";

export type { CachedCollection } from "@/lib/utils";
export { readSidebarCache } from "@/lib/utils";

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
