/**
 * @context  Core layer — studio initializer at src/core/init.ts
 * @does     Convenience function to initialize the content store for Node.js environments
 * @depends  src/core/content-store.ts, src/cli/adapters/fs-adapter.ts
 * @do       Use this as the entry point for Next.js and other Node.js consumers
 * @dont     Import from UI; use in browser environments
 */

import path from "node:path";
import { FsAdapter } from "../cli/adapters/fs-adapter.js";
import { loadContent, getStore } from "./content-store.js";
import type { StudioConfig } from "../shared/types.js";

/**
 * Initialize the content store from the filesystem.
 * Call this once before using `queryCollection()`.
 *
 * @param contentsDir - Path to the contents directory. Defaults to `./contents` relative to cwd.
 * @param config - Optional studio config for schemas and scripts.
 *
 * @example
 * ```ts
 * import { initStudio, queryCollection } from "nextjs-studio";
 *
 * await initStudio();
 * const posts = queryCollection("posts").all();
 * ```
 */
export async function initStudio(
  contentsDir?: string,
  config?: StudioConfig,
): Promise<void> {
  const dir = contentsDir ?? path.join(process.cwd(), "contents");
  await loadContent(new FsAdapter(dir), config);
}

/**
 * Returns true if the content store has been initialized.
 */
export function isStudioInitialized(): boolean {
  try {
    getStore();
    return true;
  } catch {
    return false;
  }
}
