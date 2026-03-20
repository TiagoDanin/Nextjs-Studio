import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadContent, loadContentSync, getStore } from "../src/core/content-store.js";
import { queryCollection } from "../src/core/query-builder.js";
import { FsAdapter } from "../src/cli/adapters/fs-adapter.js";

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

  describe("loadContent (async)", () => {
    it("should initialize the content store from a given directory", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      await loadContent(new FsAdapter(tmpDir));

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

      await loadContent(new FsAdapter(tmpDir));

      const results = queryCollection("blog").all();
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Hello");
    });

    it("should accept optional config", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");

      await loadContent(new FsAdapter(tmpDir), {
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
      await loadContent(new FsAdapter(tmpDir));
      expect(getStore().getCollections()).toEqual([]);
    });
  });

  describe("loadContentSync", () => {
    it("should initialize the content store synchronously", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      loadContentSync(new FsAdapter(tmpDir));

      const store = getStore();
      expect(store).toBeDefined();
      expect(store.getCollection("blog")).toHaveLength(1);
    });

    it("should allow querying after sync initialization", async () => {
      await writeContent(
        "blog/hello.mdx",
        `---
title: Hello
published: true
---

Hello content`,
      );

      loadContentSync(new FsAdapter(tmpDir));

      const results = queryCollection("blog").all();
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Hello");
    });

    it("should accept optional config", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");

      loadContentSync(new FsAdapter(tmpDir), {
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
      loadContentSync(new FsAdapter(tmpDir));
      expect(getStore().getCollections()).toEqual([]);
    });
  });
});
