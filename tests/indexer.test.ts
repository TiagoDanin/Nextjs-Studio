import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ContentIndex } from "../src/core/indexer.js";
import { FsAdapter } from "../src/cli/adapters/fs-adapter.js";

describe("ContentIndex", () => {
  let tmpDir: string;
  let index: ContentIndex;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-idx-"));
    index = new ContentIndex(new FsAdapter(tmpDir));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeContent(filePath: string, content: string) {
    const full = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf-8");
  }

  describe("MDX collections", () => {
    it("should index MDX files with frontmatter", async () => {
      await writeContent(
        "blog/hello.mdx",
        `---
title: Hello
published: true
---

# Hello`,
      );
      await writeContent(
        "blog/world.mdx",
        `---
title: World
published: false
---

# World`,
      );

      await index.build();

      const entries = index.getCollection("blog");
      expect(entries).toHaveLength(2);

      const hello = entries.find((e) => e.slug === "hello");
      expect(hello).toBeDefined();
      expect(hello!.data.title).toBe("Hello");
      expect(hello!.data.published).toBe(true);
      expect(hello!.body).toContain("# Hello");
      expect(hello!.collection).toBe("blog");
      expect(hello!.path).toBe("/blog/hello");
    });

    it("should detect collection type as mdx", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");

      await index.build();

      const collections = index.getCollections();
      const blog = collections.find((c) => c.name === "blog");
      expect(blog).toBeDefined();
      expect(blog!.type).toBe("mdx");
      expect(blog!.count).toBe(1);
    });
  });

  describe("JSON array collections", () => {
    it("should index JSON array entries with slug field", async () => {
      await writeContent(
        "products/index.json",
        JSON.stringify([
          { slug: "product-a", name: "Product A", price: 10 },
          { slug: "product-b", name: "Product B", price: 20 },
        ]),
      );

      await index.build();

      const entries = index.getCollection("products");
      expect(entries).toHaveLength(2);

      const a = entries.find((e) => e.slug === "product-a");
      expect(a).toBeDefined();
      expect(a!.data.name).toBe("Product A");
      expect(a!.path).toBe("/products/product-a");
    });

    it("should use index-based slugs when no slug field", async () => {
      await writeContent(
        "items/index.json",
        JSON.stringify([{ name: "A" }, { name: "B" }]),
      );

      await index.build();

      const entries = index.getCollection("items");
      expect(entries[0].slug).toBe("index/0");
      expect(entries[1].slug).toBe("index/1");
    });

    it("should detect collection type as json-array", async () => {
      await writeContent(
        "products/index.json",
        JSON.stringify([{ name: "A" }, { name: "B" }]),
      );

      await index.build();

      const collections = index.getCollections();
      const products = collections.find((c) => c.name === "products");
      expect(products!.type).toBe("json-array");
    });
  });

  describe("JSON object collections", () => {
    it("should index JSON object as single entry", async () => {
      await writeContent(
        "settings/index.json",
        JSON.stringify({ title: "My Site", theme: "dark" }),
      );

      await index.build();

      const entries = index.getCollection("settings");
      expect(entries).toHaveLength(1);
      expect(entries[0].data.title).toBe("My Site");
      expect(entries[0].slug).toBe("index");
    });

    it("should detect collection type as json-object", async () => {
      await writeContent(
        "settings/index.json",
        JSON.stringify({ title: "Site" }),
      );

      await index.build();

      const collections = index.getCollections();
      const settings = collections.find((c) => c.name === "settings");
      expect(settings!.type).toBe("json-object");
    });
  });

  describe("collection ordering", () => {
    it("should apply ordering from collection.json", async () => {
      await writeContent("blog/aaa.mdx", "---\ntitle: AAA\n---\nA");
      await writeContent("blog/bbb.mdx", "---\ntitle: BBB\n---\nB");
      await writeContent("blog/ccc.mdx", "---\ntitle: CCC\n---\nC");
      await writeContent(
        "blog/collection.json",
        JSON.stringify(["ccc", "aaa", "bbb"]),
      );

      await index.build();

      const entries = index.getCollection("blog");
      expect(entries.map((e) => e.slug)).toEqual(["ccc", "aaa", "bbb"]);
    });
  });

  describe("nested folders", () => {
    it("should create hierarchical slugs", async () => {
      await writeContent(
        "docs/guides/intro.mdx",
        "---\ntitle: Intro\n---\nGuide intro",
      );
      await writeContent(
        "docs/api/reference.mdx",
        "---\ntitle: API Ref\n---\nAPI reference",
      );

      await index.build();

      const entries = index.getCollection("docs");
      const slugs = entries.map((e) => e.slug).sort();
      expect(slugs).toEqual(["api/reference", "guides/intro"]);

      const intro = entries.find((e) => e.slug === "guides/intro");
      expect(intro!.path).toBe("/docs/guides/intro");
    });
  });

  describe("multiple collections", () => {
    it("should discover all collections", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await writeContent(
        "products/index.json",
        JSON.stringify([{ name: "A" }]),
      );
      await writeContent(
        "settings/index.json",
        JSON.stringify({ title: "Site" }),
      );

      await index.build();

      const collections = index.getCollections();
      const names = collections.map((c) => c.name).sort();
      expect(names).toEqual(["blog", "products", "settings"]);
    });
  });

  describe("updateEntry", () => {
    it("should add a new entry to an existing collection", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();

      expect(index.getCollection("blog")).toHaveLength(1);

      index.updateEntry("blog", {
        collection: "blog",
        slug: "new-post",
        path: "/blog/new-post",
        body: "New body",
        data: { title: "New Post" },
      });

      expect(index.getCollection("blog")).toHaveLength(2);
      const newEntry = index.getCollection("blog").find(
        (e) => e.slug === "new-post",
      );
      expect(newEntry).toBeDefined();
      expect(newEntry!.data.title).toBe("New Post");
    });

    it("should replace an existing entry by slug", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Original\n---\nBody");
      await index.build();

      index.updateEntry("blog", {
        collection: "blog",
        slug: "post",
        path: "/blog/post",
        body: "Updated body",
        data: { title: "Updated" },
      });

      const entries = index.getCollection("blog");
      expect(entries).toHaveLength(1);
      expect(entries[0].data.title).toBe("Updated");
      expect(entries[0].body).toBe("Updated body");
    });

    it("should update collection metadata count", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();

      index.updateEntry("blog", {
        collection: "blog",
        slug: "another",
        path: "/blog/another",
        body: "Another body",
        data: { title: "Another" },
      });

      const collections = index.getCollections();
      const blog = collections.find((c) => c.name === "blog");
      expect(blog!.count).toBe(2);
    });

    it("should create entries array for a collection that has metadata", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();

      // updateEntry on a known collection but with no prior entries in the
      // internal map should still work because the collection was already
      // built via build().
      index.updateEntry("blog", {
        collection: "blog",
        slug: "post",
        path: "/blog/post",
        body: "Replaced",
        data: { title: "Replaced" },
      });

      expect(index.getCollection("blog")).toHaveLength(1);
    });
  });

  describe("removeEntry", () => {
    it("should remove an entry by slug", async () => {
      await writeContent("blog/aaa.mdx", "---\ntitle: AAA\n---\nA");
      await writeContent("blog/bbb.mdx", "---\ntitle: BBB\n---\nB");
      await index.build();

      expect(index.getCollection("blog")).toHaveLength(2);

      index.removeEntry("blog", "aaa");

      const entries = index.getCollection("blog");
      expect(entries).toHaveLength(1);
      expect(entries[0].slug).toBe("bbb");
    });

    it("should update collection metadata count after removal", async () => {
      await writeContent("blog/aaa.mdx", "---\ntitle: AAA\n---\nA");
      await writeContent("blog/bbb.mdx", "---\ntitle: BBB\n---\nB");
      await index.build();

      index.removeEntry("blog", "aaa");

      const collections = index.getCollections();
      const blog = collections.find((c) => c.name === "blog");
      expect(blog!.count).toBe(1);
    });

    it("should do nothing when removing from a non-existing collection", () => {
      index.removeEntry("nonexistent", "slug");
      expect(index.getCollection("nonexistent")).toEqual([]);
    });

    it("should do nothing when slug does not exist", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();

      index.removeEntry("blog", "nonexistent-slug");

      expect(index.getCollection("blog")).toHaveLength(1);
    });

    it("should handle removing the last entry in a collection", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();

      index.removeEntry("blog", "post");

      expect(index.getCollection("blog")).toHaveLength(0);
      const blog = index.getCollections().find((c) => c.name === "blog");
      expect(blog!.count).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should return empty for non-existing collection", () => {
      expect(index.getCollection("nonexistent")).toEqual([]);
    });

    it("should handle empty contents directory", async () => {
      await index.build();

      expect(index.getCollections()).toEqual([]);
    });

    it("should clear previous data on rebuild", async () => {
      await writeContent("blog/post.mdx", "---\ntitle: Post\n---\nBody");
      await index.build();
      expect(index.getCollection("blog")).toHaveLength(1);

      await fs.rm(path.join(tmpDir, "blog"), { recursive: true });
      await index.build();
      expect(index.getCollections()).toEqual([]);
    });
  });
});
