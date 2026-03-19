import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { writeJsonFile, writeMdxEntries } from "../src/core/content-writer.js";
import { FsAdapter } from "../src/cli/adapters/fs-adapter.js";

describe("content-writer", () => {
  let tmpDir: string;
  let adapter: FsAdapter;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-cw-"));
    adapter = new FsAdapter(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("writeJsonFile", () => {
    it("should write JSON content to a file", async () => {
      const jsonContent = JSON.stringify({ title: "Test", value: 42 }, null, 2);
      await writeJsonFile(adapter, "settings/config.json", jsonContent);

      const written = await fs.readFile(
        path.join(tmpDir, "settings/config.json"),
        "utf-8",
      );
      expect(written).toBe(jsonContent + "\n");
    });

    it("should append a trailing newline", async () => {
      await writeJsonFile(adapter, "data.json", '{"a":1}');

      const written = await fs.readFile(path.join(tmpDir, "data.json"), "utf-8");
      expect(written.endsWith("\n")).toBe(true);
    });

    it("should create directories if they do not exist", async () => {
      await writeJsonFile(adapter, "deep/nested/dir/file.json", "{}");

      const exists = await fs
        .access(path.join(tmpDir, "deep/nested/dir/file.json"))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it("should overwrite existing file", async () => {
      await writeJsonFile(adapter, "data.json", '{"v":1}');
      await writeJsonFile(adapter, "data.json", '{"v":2}');

      const written = await fs.readFile(path.join(tmpDir, "data.json"), "utf-8");
      expect(written).toBe('{"v":2}\n');
    });

    it("should write a JSON array", async () => {
      const content = JSON.stringify([{ name: "A" }, { name: "B" }]);
      await writeJsonFile(adapter, "items.json", content);

      const written = await fs.readFile(path.join(tmpDir, "items.json"), "utf-8");
      expect(written).toBe(content + "\n");
    });
  });

  describe("writeMdxEntries", () => {
    it("should write a single MDX entry with frontmatter and body", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "blog/hello.mdx",
          frontmatter: { title: "Hello", published: true },
          body: "# Hello World",
        },
      ]);

      const written = await fs.readFile(
        path.join(tmpDir, "blog/hello.mdx"),
        "utf-8",
      );
      expect(written).toContain("title: Hello");
      expect(written).toContain("published: true");
      expect(written).toContain("# Hello World");
    });

    it("should write multiple MDX entries", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "blog/post-a.mdx",
          frontmatter: { title: "Post A" },
          body: "Content A",
        },
        {
          filePath: "blog/post-b.mdx",
          frontmatter: { title: "Post B" },
          body: "Content B",
        },
      ]);

      const a = await fs.readFile(path.join(tmpDir, "blog/post-a.mdx"), "utf-8");
      const b = await fs.readFile(path.join(tmpDir, "blog/post-b.mdx"), "utf-8");

      expect(a).toContain("title: Post A");
      expect(a).toContain("Content A");
      expect(b).toContain("title: Post B");
      expect(b).toContain("Content B");
    });

    it("should create directories if they do not exist", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "docs/guides/intro.mdx",
          frontmatter: { title: "Intro" },
          body: "Guide intro",
        },
      ]);

      const written = await fs.readFile(
        path.join(tmpDir, "docs/guides/intro.mdx"),
        "utf-8",
      );
      expect(written).toContain("title: Intro");
    });

    it("should handle empty frontmatter", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "blog/bare.mdx",
          frontmatter: {},
          body: "Just body",
        },
      ]);

      const written = await fs.readFile(
        path.join(tmpDir, "blog/bare.mdx"),
        "utf-8",
      );
      expect(written).toContain("Just body");
    });

    it("should handle nested frontmatter values", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "blog/nested.mdx",
          frontmatter: {
            title: "Post",
            meta: { priority: 1, tags: ["a", "b"] },
          },
          body: "Body",
        },
      ]);

      const written = await fs.readFile(
        path.join(tmpDir, "blog/nested.mdx"),
        "utf-8",
      );
      expect(written).toContain("title: Post");
      expect(written).toContain("priority: 1");
    });

    it("should skip entries with empty filePath", async () => {
      await writeMdxEntries(adapter, [
        {
          filePath: "",
          frontmatter: { title: "Skip" },
          body: "Should not be written",
        },
        {
          filePath: "blog/kept.mdx",
          frontmatter: { title: "Kept" },
          body: "This is kept",
        },
      ]);

      const keptExists = await fs
        .access(path.join(tmpDir, "blog/kept.mdx"))
        .then(() => true)
        .catch(() => false);
      expect(keptExists).toBe(true);
    });

    it("should handle empty sources array", async () => {
      await expect(writeMdxEntries(adapter, [])).resolves.toBeUndefined();
    });
  });
});
