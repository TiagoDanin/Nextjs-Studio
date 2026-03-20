/**
 * @context  Core layer — content store at src/core/content-store.ts
 * @does     Manages a singleton ContentIndex; exposes loadContent() and getStore() for consumers
 * @depends  src/core/indexer.ts, src/shared/types.ts
 * @do       Use this as the single access point for in-memory indexed content
 * @dont     Import from CLI or UI; contain parsing or I/O logic; import fs-adapter at top level
 */

import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import type { StudioConfig } from "../shared/types.js";
import { ContentIndex } from "./indexer.js";

let store: ContentIndex | null = null;

export function getStore(): ContentIndex {
  if (!store) {
    throw new Error(
      "Content not loaded. Auto-init requires 'nextjs-studio/server' — " +
      "use loadContentSync() in a server context, or queryCollection() " +
      "will auto-init when imported from 'nextjs-studio/server'.",
    );
  }
  return store;
}

export function setStore(index: ContentIndex): void {
  store = index;
}

export function hasStore(): boolean {
  return store !== null;
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

export function loadContentSync(
  fsAdapter: IFsAdapter,
  config?: StudioConfig,
): ContentIndex {
  const index = new ContentIndex(fsAdapter);
  index.buildSync(config);
  store = index;
  return index;
}
