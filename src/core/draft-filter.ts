/**
 * @context  Core layer — draft filter at src/core/draft-filter.ts
 * @does     Provides utilities to detect and filter draft content entries
 * @depends  src/shared/types.ts
 * @do       Add new draft detection heuristics here
 * @dont     Import from CLI or UI; access filesystem
 */

import type { ContentEntry } from "../shared/types.js";

export function isDraft(entry: ContentEntry): boolean {
  return entry.data.draft === true;
}

export function filterDrafts(entries: ContentEntry[]): ContentEntry[] {
  return entries.filter((entry) => !isDraft(entry));
}
