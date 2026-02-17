import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FsAdapter } from "../src/cli/adapters/fs-adapter.js";

describe("FsAdapter", () => {
  let tmpDir: string;
  let adapter: FsAdapter;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-test-"));
    adapter = new FsAdapter(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("readFile / writeFile", () => {
    it("should write and read a file", async () => {
      await adapter.writeFile("test.txt", "hello world");

      const content = await adapter.readFile("test.txt");
      expect(content).toBe("hello world");
    });

    it("should create nested directories automatically", async () => {
      await adapter.writeFile("a/b/c/deep.txt", "deep content");

      const content = await adapter.readFile("a/b/c/deep.txt");
      expect(content).toBe("deep content");
    });
  });

  describe("deleteFile", () => {
    it("should delete a file", async () => {
      await adapter.writeFile("to-delete.txt", "bye");
      await adapter.deleteFile("to-delete.txt");

      expect(await adapter.exists("to-delete.txt")).toBe(false);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      await adapter.writeFile("exists.txt", "yes");

      expect(await adapter.exists("exists.txt")).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      expect(await adapter.exists("nope.txt")).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return file stats", async () => {
      await adapter.writeFile("stats.txt", "some content");

      const stats = await adapter.getStats("stats.txt");
      expect(stats.path).toBe("stats.txt");
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.modifiedAt).toBeInstanceOf(Date);
    });
  });

  describe("listFiles", () => {
    it("should list only supported files by default", async () => {
      await adapter.writeFile("blog/post.mdx", "# Post");
      await adapter.writeFile("blog/data.json", "{}");
      await adapter.writeFile("blog/readme.txt", "ignore me");

      const files = await adapter.listFiles("blog");

      const names = files.map((f) => path.basename(f));
      expect(names).toContain("post.mdx");
      expect(names).toContain("data.json");
      expect(names).not.toContain("readme.txt");
    });

    it("should filter by custom extensions", async () => {
      await adapter.writeFile("dir/a.mdx", "mdx");
      await adapter.writeFile("dir/b.json", "json");

      const files = await adapter.listFiles("dir", [".mdx"] as const);

      const names = files.map((f) => path.basename(f));
      expect(names).toContain("a.mdx");
      expect(names).not.toContain("b.json");
    });

    it("should return empty array for non-existing directory", async () => {
      const files = await adapter.listFiles("nonexistent");
      expect(files).toEqual([]);
    });
  });

  describe("listDirectories", () => {
    it("should list subdirectories", async () => {
      await adapter.writeFile("blog/post.mdx", "# Post");
      await adapter.writeFile("products/index.json", "[]");

      const dirs = await adapter.listDirectories(".");

      const names = dirs.map((d) => path.basename(d));
      expect(names).toContain("blog");
      expect(names).toContain("products");
    });

    it("should return empty array for non-existing directory", async () => {
      const dirs = await adapter.listDirectories("nonexistent");
      expect(dirs).toEqual([]);
    });
  });

  describe("path utilities", () => {
    it("basename should return file name", () => {
      expect(adapter.basename("blog/post.mdx")).toBe("post.mdx");
    });

    it("extname should return extension", () => {
      expect(adapter.extname("post.mdx")).toBe(".mdx");
      expect(adapter.extname("data.json")).toBe(".json");
    });

    it("normalizeSlug should convert path to slug", () => {
      expect(adapter.normalizeSlug("post.mdx", ".mdx")).toBe("post");
    });
  });
});
