/**
 * @context  CLI layer — file watcher at src/cli/adapters/watcher.ts
 * @does     Watches the contents directory with chokidar and emits typed WatchEvents on file changes
 * @depends  src/shared/types.ts, src/shared/constants.ts
 * @do       Add new event types here if new chokidar events need to be handled
 * @dont     Import from UI; perform I/O beyond chokidar; contain business logic
 */

import path from "node:path";
import { EventEmitter } from "node:events";
import { watch as chokidarWatch, type FSWatcher } from "chokidar";
import type { WatchEvent } from "../../shared/types.js";
import { SUPPORTED_EXTENSIONS, WATCHER_DEBOUNCE_MS } from "../../shared/constants.js";

type WatchEventType = WatchEvent["type"];

interface ContentWatcherEvents {
  "content:add": [event: WatchEvent];
  "content:change": [event: WatchEvent];
  "content:delete": [event: WatchEvent];
  error: [error: Error];
}

export class ContentWatcher extends EventEmitter<ContentWatcherEvents> {
  private watcher: FSWatcher | null = null;
  private readonly contentsDir: string;
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(contentsDir: string) {
    super();
    this.contentsDir = path.resolve(contentsDir);
  }

  async start(): Promise<void> {
    if (this.watcher) return;

    this.watcher = chokidarWatch(this.contentsDir, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: WATCHER_DEBOUNCE_MS,
      },
    });

    this.watcher.on("add", (filePath) => this.handleEvent("add", filePath));
    this.watcher.on("change", (filePath) => this.handleEvent("change", filePath));
    this.watcher.on("unlink", (filePath) => this.handleEvent("delete", filePath));
    this.watcher.on("error", (error) =>
      this.emit("error", error instanceof Error ? error : new Error(String(error))),
    );
  }

  async stop(): Promise<void> {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  private handleEvent(type: WatchEventType, filePath: string): void {
    const ext = path.extname(filePath);
    if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) return;

    const key = `${type}:${filePath}`;
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      const event = this.parseFilePath(type, filePath);
      if (event) this.emit(`content:${type}`, event);
    }, WATCHER_DEBOUNCE_MS);

    this.debounceTimers.set(key, timer);
  }

  isRunning(): boolean {
    return this.watcher !== null;
  }

  private parseFilePath(type: WatchEventType, filePath: string): WatchEvent | null {
    const relative = path.relative(this.contentsDir, filePath);
    const parts = relative.split(path.sep);

    if (parts.length < 2) return null;

    const collection = parts[0];
    const fileName = parts[parts.length - 1];
    const ext = path.extname(fileName);

    return {
      type,
      collection,
      slug: fileName.replace(ext, ""),
      extension: ext,
      filePath: relative,
    };
  }
}

let singletonWatcher: ContentWatcher | null = null;

export function getWatcher(contentsDir: string): ContentWatcher {
  if (!singletonWatcher) {
    singletonWatcher = new ContentWatcher(contentsDir);
  }
  return singletonWatcher;
}
