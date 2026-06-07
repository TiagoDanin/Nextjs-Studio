/**
 * @context  CLI layer — bridge that connects ContentWatcher events to the in-memory ContentIndex
 * @does     Subscribes to chokidar events and incrementally reindexes affected files
 * @depends  src/cli/adapters/watcher.ts, src/core/indexer.ts
 * @do       Use this in long-lived processes (the studio UI) so file edits reflect without rebuild
 * @dont     Import from UI components; use during build-time-only flows
 */

import type { ContentIndex } from "../../core/indexer.js";
import type { ContentWatcher } from "./watcher.js";

let bridgeInstalled = false;

/**
 * Wires a ContentWatcher to a ContentIndex so file changes trigger
 * incremental reindexing. Idempotent — safe to call multiple times.
 */
export function installContentWatcherBridge(
  watcher: ContentWatcher,
  index: ContentIndex,
): void {
  if (bridgeInstalled) return;
  bridgeInstalled = true;

  const handle = (event: { filePath: string }) => {
    void index.reindexFile(event.filePath).catch((err) => {
      console.warn("[Nextjs Studio] reindex failed:", err);
    });
  };

  watcher.on("content:add", handle);
  watcher.on("content:change", handle);
  watcher.on("content:delete", handle);
}

export function resetWatcherBridge(): void {
  bridgeInstalled = false;
}
