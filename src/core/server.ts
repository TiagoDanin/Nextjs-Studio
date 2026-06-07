/**
 * @context  Core layer — server entry point at src/core/server.ts
 * @does     Re-exports server-only APIs and auto-initializes the content store
 * @depends  src/core/fs-adapter.ts, src/core/content-store.ts
 * @do       Import from 'nextjs-studio/server' in Next.js server components
 * @dont     Import from client components
 */

import path from "node:path";
import { CONTENTS_DIR } from "../shared/constants.js";
import { FsAdapter } from "./fs-adapter.js";
import { ContentIndex } from "./indexer.js";
import { hasStore, setStore } from "./content-store.js";

// Auto-initialize the content store synchronously on import
if (!hasStore()) {
  const dir = path.join(process.cwd(), CONTENTS_DIR);
  const index = new ContentIndex(new FsAdapter(dir));
  index.buildSync();
  setStore(index);

  // In dev mode, start a watcher so `queryCollection()` reflects edits without restart.
  // Disabled when STUDIO_NO_WATCH=1 to allow opt-out (e.g. for builds running on dev env).
  if (process.env.NODE_ENV === "development" && process.env.STUDIO_NO_WATCH !== "1") {
    void startDevWatcher(dir, index);
  }
}

async function startDevWatcher(dir: string, index: ContentIndex): Promise<void> {
  try {
    const { watch } = await import("chokidar");
    const watcher = watch(dir, { ignoreInitial: true, persistent: true });
    const reindex = (filePath: string) => {
      const rel = path.relative(dir, filePath);
      void index.reindexFile(rel).catch(() => {});
    };
    watcher.on("add", reindex);
    watcher.on("change", reindex);
    watcher.on("unlink", reindex);
  } catch {
    // chokidar not available — silently skip dev watcher
  }
}

export { FsAdapter } from "./fs-adapter.js";
export { ContentIndex } from "./indexer.js";
export { loadContent, loadContentSync } from "./content-store.js";
export { queryCollection } from "./query-builder.js";

export type {
  ContentEntry,
  Collection,
  CollectionTypeMap,
  StudioConfig,
  CollectionConfig,
  QueryOptions,
} from "../shared/types.js";

export type { QueryResult } from "./query-builder.js";
