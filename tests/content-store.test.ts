import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadContent, getStore } from "../src/core/content-store.js";
import { FsAdapter } from "../src/core/fs-adapter.js";
import type { ContentIndex } from "../src/core/indexer.js";

describe("content-store", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-cs-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeContent(filePath: string, content: string) {
    const full = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf-8");
  }

  describe("loadContent", () => {
    it("should return a ContentIndex", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      expect(index).toBeDefined();
      expect(typeof index.getCollection).toBe("function");
      expect(typeof index.getCollections).toBe("function");
    });

    it("should index MDX content", async () => {
      await writeContent(
        "blog/hello.mdx",
        `---
title: Hello
published: true
---

Content here`,
      );

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      const entries = index.getCollection("blog");
      expect(entries).toHaveLength(1);
      expect(entries[0].data.title).toBe("Hello");
    });

    it("should index JSON array content", async () => {
      await writeContent(
        "products/index.json",
        JSON.stringify([
          { slug: "widget", name: "Widget", price: 10 },
          { slug: "gadget", name: "Gadget", price: 20 },
        ]),
      );

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      const entries = index.getCollection("products");
      expect(entries).toHaveLength(2);
    });

    it("should index JSON object content", async () => {
      await writeContent(
        "settings/index.json",
        JSON.stringify({ siteName: "My Site", theme: "light" }),
      );

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      const entries = index.getCollection("settings");
      expect(entries).toHaveLength(1);
      expect(entries[0].data.siteName).toBe("My Site");
    });

    it("should handle multiple collections", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await writeContent(
        "products/index.json",
        JSON.stringify([{ name: "A" }]),
      );

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      const collections = index.getCollections();
      const names = collections.map((c) => c.name).sort();
      expect(names).toEqual(["blog", "products"]);
    });

    it("should handle empty contents directory", async () => {
      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);

      expect(index.getCollections()).toEqual([]);
    });

    it("should accept optional StudioConfig", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");

      const adapter = new FsAdapter(tmpDir);
      const config = {
        collections: {
          blog: {
            schema: {
              collection: "blog",
              fields: [{ name: "title", type: "text" as const }],
            },
          },
        },
      };

      const index = await loadContent(adapter, config);
      const collections = index.getCollections();
      const blog = collections.find((c) => c.name === "blog");
      expect(blog).toBeDefined();
      expect(blog!.schema).toBeDefined();
      expect(blog!.schema!.fields).toHaveLength(1);
    });
  });

  describe("getStore", () => {
    it("should return the store after loadContent is called", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      const adapter = new FsAdapter(tmpDir);
      await loadContent(adapter);

      const store = getStore();
      expect(store).toBeDefined();
      expect(store.getCollection("blog")).toHaveLength(1);
    });

    it("should return the same index that loadContent returned", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Test\n---\nBody");

      const adapter = new FsAdapter(tmpDir);
      const index = await loadContent(adapter);
      const store = getStore();

      expect(store).toBe(index);
    });

    it("should reflect the most recent loadContent call", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: First\n---\nBody");

      const adapter1 = new FsAdapter(tmpDir);
      await loadContent(adapter1);
      expect(getStore().getCollection("blog")).toHaveLength(1);

      await writeContent("blog/second.mdx", "---\ntitle: Second\n---\nBody");

      const adapter2 = new FsAdapter(tmpDir);
      await loadContent(adapter2);
      expect(getStore().getCollection("blog")).toHaveLength(2);
    });
  });
});
