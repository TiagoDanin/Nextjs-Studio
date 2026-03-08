/**
 * @context  Core layer — content store at src/core/content-store.ts
 * @does     Manages a singleton ContentIndex; exposes loadContent() and getStore() for consumers
 * @depends  src/core/indexer.ts, src/shared/fs-adapter.interface.ts, src/shared/types.ts
 * @do       Use this as the single access point for in-memory indexed content
 * @dont     Import from CLI or UI; instantiate FsAdapter here; contain parsing or I/O logic
 */

import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import type { StudioConfig } from "../shared/types.js";
import { ContentIndex } from "./indexer.js";

let store: ContentIndex | null = null;

export function getStore(): ContentIndex {
  if (!store) {
    throw new Error("Content not loaded. Call loadContent() before querying.");
  }
  return store;
}

export async function loadContent(
  fsAdapter: IFsAdapter,
  config?: StudioConfig,
): Promise<ContentIndex> {
  const index = new ContentIndex(fsAdapter);
  await index.build(config);
  store = index;
  return index;
}
