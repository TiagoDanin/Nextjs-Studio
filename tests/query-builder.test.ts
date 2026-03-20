import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadContent } from "../src/core/content-store.js";
import { queryCollection } from "../src/core/query-builder.js";
import { FsAdapter } from "../src/core/fs-adapter.js";

describe("queryCollection", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-qb-"));

    await writeContent(
      "blog/post-a.mdx",
      `---
title: Post A
date: 2026-01-10
published: true
meta:
  priority: 2
---

Content A`,
    );
    await writeContent(
      "blog/post-b.mdx",
      `---
title: Post B
date: 2026-02-15
published: true
meta:
  priority: 1
---

Content B`,
    );
    await writeContent(
      "blog/post-c.mdx",
      `---
title: Post C
date: 2026-01-20
published: false
meta:
  priority: 3
---

Content C`,
    );
    await writeContent(
      "blog/post-d.mdx",
      `---
title: Post D (Draft)
date: 2026-03-01
published: true
draft: true
meta:
  priority: 4
---

Draft content D`,
    );
    await writeContent(
      "products/index.json",
      JSON.stringify([
        { slug: "x", name: "X", price: 30 },
        { slug: "y", name: "Y", price: 10 },
        { slug: "z", name: "Z", price: 20 },
      ]),
    );
    await writeContent(
      "pages/index.json",
      JSON.stringify({
        title: "Home",
        hero: { title: "Welcome", subtitle: "Hi" },
      }),
    );

    await loadContent(new FsAdapter(tmpDir));
  });

  async function writeContent(filePath: string, content: string) {
    const full = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf-8");
  }

  describe("where", () => {
    it("should filter by simple condition", () => {
      const results = queryCollection("blog")
        .where({ published: true })
        .all();

      expect(results).toHaveLength(3);
      expect(results.every((e) => e.published === true)).toBe(true);
    });

    it("should filter by multiple conditions", () => {
      const results = queryCollection("blog")
        .where({ published: true })
        .where({ title: "Post A" })
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Post A");
    });

    it("should support dot notation for nested fields", () => {
      const results = queryCollection("pages")
        .where({ "hero.title": "Welcome" })
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Home");
    });

    it("should return empty for no matches", () => {
      const results = queryCollection("blog")
        .where({ published: "nonexistent" })
        .all();

      expect(results).toHaveLength(0);
    });
  });

  describe("sort", () => {
    it("should sort by string field ascending", () => {
      const results = queryCollection("blog").sort("title", "asc").all();

      expect(results.map((e) => e.title)).toEqual([
        "Post A",
        "Post B",
        "Post C",
        "Post D (Draft)",
      ]);
    });

    it("should sort by string field descending", () => {
      const results = queryCollection("blog").sort("title", "desc").all();

      expect(results.map((e) => e.title)).toEqual([
        "Post D (Draft)",
        "Post C",
        "Post B",
        "Post A",
      ]);
    });

    it("should sort by number field", () => {
      const results = queryCollection("products").sort("price", "asc").all();

      expect(results.map((e) => e.price)).toEqual([10, 20, 30]);
    });

    it("should sort by date field", () => {
      const results = queryCollection("blog").sort("date", "desc").all();

      const titles = results.map((e) => e.title);
      expect(titles[0]).toBe("Post D (Draft)"); // Mar 01
      expect(titles[1]).toBe("Post B"); // Feb 15
      expect(titles[2]).toBe("Post C"); // Jan 20
      expect(titles[3]).toBe("Post A"); // Jan 10
    });

    it("should sort by nested field with dot notation", () => {
      const results = queryCollection("blog")
        .sort("meta.priority", "desc")
        .all();

      expect(results.map((e) => e.title)).toEqual([
        "Post D (Draft)",
        "Post C",
        "Post A",
        "Post B",
      ]);
    });
  });

  describe("limit and offset", () => {
    it("should limit results", () => {
      const results = queryCollection("blog")
        .sort("title", "asc")
        .limit(2)
        .all();

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.title)).toEqual(["Post A", "Post B"]);
    });

    it("should offset results", () => {
      const results = queryCollection("blog")
        .sort("title", "asc")
        .offset(1)
        .all();

      expect(results).toHaveLength(3);
      expect(results.map((e) => e.title)).toEqual([
        "Post B",
        "Post C",
        "Post D (Draft)",
      ]);
    });

    it("should combine offset and limit", () => {
      const results = queryCollection("blog")
        .sort("title", "asc")
        .offset(1)
        .limit(1)
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Post B");
    });
  });

  describe("first", () => {
    it("should return the first matching entry", () => {
      const result = queryCollection("blog")
        .where({ published: true })
        .sort("date", "desc")
        .first();

      expect(result).toBeDefined();
      expect(result!.title).toBe("Post D (Draft)");
    });

    it("should return undefined for no matches", () => {
      const result = queryCollection("blog")
        .where({ title: "nonexistent" })
        .first();

      expect(result).toBeUndefined();
    });
  });

  describe("count", () => {
    it("should count all entries in collection", () => {
      expect(queryCollection("blog").count()).toBe(4);
    });

    it("should count filtered entries", () => {
      expect(queryCollection("blog").where({ published: true }).count()).toBe(
        3,
      );
    });
  });

  describe("chaining", () => {
    it("should support full chain: where + sort + offset + limit", () => {
      const results = queryCollection("blog")
        .where({ published: true })
        .sort("date", "asc")
        .offset(0)
        .limit(1)
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Post A");
    });
  });

  describe("excludeDrafts", () => {
    it("should exclude entries with draft: true", () => {
      const results = queryCollection("blog").excludeDrafts().all();

      expect(results).toHaveLength(3);
      expect(results.every((e) => e.draft !== true)).toBe(true);
    });

    it("should combine with where filter", () => {
      const results = queryCollection("blog")
        .excludeDrafts()
        .where({ published: true })
        .all();

      expect(results).toHaveLength(2);
      expect(results.every((e) => e.published === true)).toBe(true);
      expect(results.every((e) => e.draft !== true)).toBe(true);
    });

    it("should combine with sort", () => {
      const results = queryCollection("blog")
        .excludeDrafts()
        .sort("title", "asc")
        .all();

      expect(results.map((e) => e.title)).toEqual([
        "Post A",
        "Post B",
        "Post C",
      ]);
    });

    it("should combine with limit", () => {
      const results = queryCollection("blog")
        .excludeDrafts()
        .sort("title", "asc")
        .limit(2)
        .all();

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.title)).toEqual(["Post A", "Post B"]);
    });

    it("should return correct count when excluding drafts", () => {
      expect(queryCollection("blog").excludeDrafts().count()).toBe(3);
    });

    it("should return correct first when excluding drafts", () => {
      const result = queryCollection("blog")
        .excludeDrafts()
        .sort("date", "desc")
        .first();

      expect(result).toBeDefined();
      expect(result!.title).toBe("Post B");
    });

    it("should not affect collections without drafts", () => {
      const results = queryCollection("products").excludeDrafts().all();
      expect(results).toHaveLength(3);
    });
  });

  describe("non-existing collection", () => {
    it("should return empty array", () => {
      expect(queryCollection("nonexistent").all()).toEqual([]);
    });

    it("should return 0 count", () => {
      expect(queryCollection("nonexistent").count()).toBe(0);
    });
  });
});
