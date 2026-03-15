/**
 * @context  Shared utility functions for the UI layer (cli/ui/lib).
 * @does     Provides the cn() class-name merge helper and localStorage-backed sidebar cache read/write.
 * @depends  clsx, tailwind-merge (external); no project-internal dependencies.
 * @do       Add small, stateless utility functions that multiple UI components need.
 * @dont     Never put React components, stores, or side-effectful code in this file.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SIDEBAR_CACHE_KEY = "studio:sidebar-collections";

export interface CachedCollection {
  name: string;
  type: "mdx" | "json-array" | "json-object";
}

export function readSidebarCache(): CachedCollection[] {
  try {
    const raw = localStorage.getItem(SIDEBAR_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CachedCollection[];
  } catch {
    return [];
  }
}

export function writeSidebarCache(collections: CachedCollection[]): void {
  try {
    localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(collections));
  } catch {
  }
}
