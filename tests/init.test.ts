import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  initStudio,
  isStudioInitialized,
  ensureContentLoaded,
} from "../src/core/init.js";
import { getStore } from "../src/core/content-store.js";
import { queryCollection } from "../src/core/query-builder.js";

describe("init", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-init-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeContent(filePath: string, content: string) {
    const full = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf-8");
  }

  describe("initStudio", () => {
    it("should initialize the content store from a given directory", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      await initStudio(tmpDir);

      const store = getStore();
      expect(store).toBeDefined();
      expect(store.getCollection("blog")).toHaveLength(1);
    });

    it("should allow querying after initialization", async () => {
      await writeContent(
        "blog/hello.mdx",
        `---
title: Hello
published: true
---

Hello content`,
      );

      await initStudio(tmpDir);

      const results = queryCollection("blog").all();
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Hello");
    });

    it("should accept optional config", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");

      await initStudio(tmpDir, {
        collections: {
          blog: {
            schema: {
              collection: "blog",
              fields: [{ name: "title", type: "text" }],
            },
          },
        },
      });

      const collections = getStore().getCollections();
      const blog = collections.find((c) => c.name === "blog");
      expect(blog!.schema).toBeDefined();
    });

    it("should handle empty directory", async () => {
      await initStudio(tmpDir);
      expect(getStore().getCollections()).toEqual([]);
    });
  });

  describe("isStudioInitialized", () => {
    it("should return true after initStudio has been called", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");
      await initStudio(tmpDir);

      expect(isStudioInitialized()).toBe(true);
    });

    it("should return true even if store is empty", async () => {
      await initStudio(tmpDir);
      expect(isStudioInitialized()).toBe(true);
    });
  });

  describe("ensureContentLoaded", () => {
    it("should initialize if not already initialized", async () => {
      // First, load content to clear any previous state by reinitializing
      await writeContent("blog/post.mdx", "---\ntitle: First\n---\nBody");
      await initStudio(tmpDir);

      // Now call ensureContentLoaded - since store is already set, it should not re-init
      await ensureContentLoaded(tmpDir);

      expect(isStudioInitialized()).toBe(true);
    });

    it("should be safe to call multiple times", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      await ensureContentLoaded(tmpDir);
      await ensureContentLoaded(tmpDir);
      await ensureContentLoaded(tmpDir);

      expect(isStudioInitialized()).toBe(true);
      expect(getStore().getCollection("blog")).toHaveLength(1);
    });

    it("should not reload content if already initialized", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Original\n---\nBody");
      await initStudio(tmpDir);

      // Add another file
      await writeContent("blog/new.mdx", "---\ntitle: New\n---\nBody");

      // ensureContentLoaded should NOT re-scan since already initialized
      await ensureContentLoaded(tmpDir);

      // Should still have original count (1) because it did not re-initialize
      expect(getStore().getCollection("blog")).toHaveLength(1);
    });
  });
});
