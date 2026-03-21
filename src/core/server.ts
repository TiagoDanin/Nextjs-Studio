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
