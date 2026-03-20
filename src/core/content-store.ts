/**
 * @context  Core layer — content store at src/core/content-store.ts
 * @does     Manages a singleton ContentIndex; exposes loadContent() and getStore() for consumers
 * @depends  src/core/indexer.ts, src/shared/fs-adapter.interface.ts, src/shared/types.ts
 * @do       Use this as the single access point for in-memory indexed content
 * @dont     Import from CLI or UI; instantiate FsAdapter here; contain parsing or I/O logic
 */

import path from "node:path";
import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import type { StudioConfig } from "../shared/types.js";
import { CONTENTS_DIR } from "../shared/constants.js";
import { FsAdapter } from "../cli/adapters/fs-adapter.js";
import { ContentIndex } from "./indexer.js";

let store: ContentIndex | null = null;

/**
 * Returns the singleton content store.
 * Auto-initializes synchronously on first access using the default contents
 * directory (`./contents` relative to cwd).
 */
export function getStore(): ContentIndex {
  if (!store) {
    const dir = path.join(process.cwd(), CONTENTS_DIR);
    const index = new ContentIndex(new FsAdapter(dir));
    index.buildSync();
    store = index;
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

export function loadContentSync(
  fsAdapter: IFsAdapter,
  config?: StudioConfig,
): ContentIndex {
  const index = new ContentIndex(fsAdapter);
  index.buildSync(config);
  store = index;
  return index;
}
