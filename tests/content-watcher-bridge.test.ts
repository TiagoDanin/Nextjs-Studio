import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { ContentIndex } from "../src/core/indexer.js";
import { FsAdapter } from "../src/core/fs-adapter.js";
import {
  installContentWatcherBridge,
  resetWatcherBridge,
} from "../src/cli/adapters/content-watcher-bridge.js";
import type { WatchEvent } from "../src/shared/types.js";

class FakeWatcher extends EventEmitter {
  emitChange(event: WatchEvent) {
    this.emit(`content:${event.type}`, event);
  }
}

async function flush() {
  await new Promise((r) => setTimeout(r, 30));
}

describe("content-watcher-bridge", () => {
  let tmpDir: string;
  let index: ContentIndex;
  let watcher: FakeWatcher;

  beforeEach(async () => {
    resetWatcherBridge();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "studio-bridge-"));
    index = new ContentIndex(new FsAdapter(tmpDir));
    watcher = new FakeWatcher();
  });

  async function write(p: string, c: string) {
    const full = path.join(tmpDir, p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, c, "utf-8");
  }

  it("reindexes a single file when 'change' event fires", async () => {
    await write("blog/post.mdx", "---\ntitle: Old\n---\nBody");
    await index.build();

    installContentWatcherBridge(watcher as never, index);

    await write("blog/post.mdx", "---\ntitle: New\n---\nBody");
    watcher.emitChange({
      type: "change",
      collection: "blog",
      slug: "post",
      extension: ".mdx",
      filePath: path.join("blog", "post.mdx"),
    });

    await flush();
    expect(index.getCollection("blog")[0].data.title).toBe("New");
  });

  it("adds an entry on 'add' event", async () => {
    await index.build();
    installContentWatcherBridge(watcher as never, index);

    await write("blog/new.mdx", "---\ntitle: New\n---\nBody");
    watcher.emitChange({
      type: "add",
      collection: "blog",
      slug: "new",
      extension: ".mdx",
      filePath: path.join("blog", "new.mdx"),
    });

    await flush();
    expect(index.getCollection("blog")).toHaveLength(1);
  });

  it("removes an entry on 'delete' event", async () => {
    await write("blog/post.mdx", "---\ntitle: T\n---\nBody");
    await index.build();
    installContentWatcherBridge(watcher as never, index);

    await fs.rm(path.join(tmpDir, "blog/post.mdx"));
    watcher.emitChange({
      type: "delete",
      collection: "blog",
      slug: "post",
      extension: ".mdx",
      filePath: path.join("blog", "post.mdx"),
    });

    await flush();
    expect(index.getCollection("blog")).toHaveLength(0);
  });

  it("is idempotent — installing twice does not double-handle events", async () => {
    await write("blog/post.mdx", "---\ntitle: V1\n---\nBody");
    await index.build();

    installContentWatcherBridge(watcher as never, index);
    installContentWatcherBridge(watcher as never, index);

    await write("blog/post.mdx", "---\ntitle: V2\n---\nBody");
    watcher.emitChange({
      type: "change",
      collection: "blog",
      slug: "post",
      extension: ".mdx",
      filePath: path.join("blog", "post.mdx"),
    });

    await flush();
    expect(watcher.listenerCount("content:change")).toBe(1);
    expect(index.getCollection("blog")[0].data.title).toBe("V2");
  });
});
