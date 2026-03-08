import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Sidebar cache — persists the collections list across page transitions
// ---------------------------------------------------------------------------

const SIDEBAR_CACHE_KEY = "studio:sidebar-collections";

export interface CachedCollection {
  name: string;
  type: "mdx" | "json-array" | "json-object";
}

/** Read the last-known collections from localStorage (client-side only). */
export function readSidebarCache(): CachedCollection[] {
  try {
    const raw = localStorage.getItem(SIDEBAR_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CachedCollection[];
  } catch {
    return [];
  }
}

/** Persist the current collections list to localStorage. */
export function writeSidebarCache(collections: CachedCollection[]): void {
  try {
    localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(collections));
  } catch {
    // localStorage unavailable — ignore
  }
}
