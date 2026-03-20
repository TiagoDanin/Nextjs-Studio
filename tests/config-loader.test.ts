import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  loadStudioConfig,
  resolveConfigPath,
} from "../src/core/config-loader.js";

describe("config-loader", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nextjs-studio-cfg-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("resolveConfigPath", () => {
    it("should find studio.config.ts", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.ts"),
        "export default {}",
      );

      const result = resolveConfigPath(tmpDir);
      expect(result).toBe(path.resolve(tmpDir, "studio.config.ts"));
    });

    it("should find studio.config.js", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.js"),
        "module.exports = {}",
      );

      const result = resolveConfigPath(tmpDir);
      expect(result).toBe(path.resolve(tmpDir, "studio.config.js"));
    });

    it("should find studio.config.mjs", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.mjs"),
        "export default {}",
      );

      const result = resolveConfigPath(tmpDir);
      expect(result).toBe(path.resolve(tmpDir, "studio.config.mjs"));
    });

    it("should prefer .ts over .js and .mjs (ordered by CONFIG_FILENAMES)", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.ts"),
        "export default { ts: true }",
      );
      await fs.writeFile(
        path.join(tmpDir, "studio.config.js"),
        "module.exports = { js: true }",
      );

      const result = resolveConfigPath(tmpDir);
      expect(result).toBe(path.resolve(tmpDir, "studio.config.ts"));
    });

    it("should return undefined when no config file exists", () => {
      const result = resolveConfigPath(tmpDir);
      expect(result).toBeUndefined();
    });

    it("should return undefined for an empty directory", () => {
      const result = resolveConfigPath(tmpDir);
      expect(result).toBeUndefined();
    });
  });

  describe("loadStudioConfig", () => {
    it("should return empty config when no file exists", async () => {
      const config = await loadStudioConfig(tmpDir);
      expect(config).toEqual({});
    });

    it("should return empty config for invalid module", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.mjs"),
        "this is not valid javascript %%%",
      );

      const config = await loadStudioConfig(tmpDir);
      expect(config).toEqual({});
    });

    it("should return empty config when module exports a non-object", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.mjs"),
        `export default "not an object";`,
      );

      const config = await loadStudioConfig(tmpDir);
      expect(config).toEqual({});
    });

    it("should return empty config when module exports an array", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.mjs"),
        `export default [1, 2, 3];`,
      );

      const config = await loadStudioConfig(tmpDir);
      expect(config).toEqual({});
    });

    it("should load config from named export 'config'", async () => {
      await fs.writeFile(
        path.join(tmpDir, "studio.config.mjs"),
        `export const config = { collections: { posts: {} } };`,
      );

      const config = await loadStudioConfig(tmpDir);
      expect(config.collections).toBeDefined();
      expect(config.collections!.posts).toBeDefined();
    });
  });
});
