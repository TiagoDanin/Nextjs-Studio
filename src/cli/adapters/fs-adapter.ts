import fs from "node:fs/promises";
import path from "node:path";
import type { FileInfo } from "../../shared/types.js";
import { SUPPORTED_EXTENSIONS } from "../../shared/constants.js";
import type { Dirent } from "node:fs";

type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export class FsAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  private resolve(...segments: string[]): string {
    return path.resolve(this.basePath, ...segments);
  }

  // --- I/O Operations ---

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(this.resolve(filePath), "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolve(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(this.resolve(filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async getStats(filePath: string): Promise<FileInfo> {
    const fullPath = this.resolve(filePath);
    const stats = await fs.stat(fullPath);
    return {
      path: filePath,
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  }

  async listFiles(
    dirPath: string,
    extensions?: readonly SupportedExtension[],
  ): Promise<string[]> {
    const fullPath = this.resolve(dirPath);
    const filterExts = extensions ?? SUPPORTED_EXTENSIONS;

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          filterExts.some((ext) => entry.name.endsWith(ext)),
      )
      .map((entry) => this.join(dirPath, entry.name));
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    const fullPath = this.resolve(dirPath);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => this.join(dirPath, entry.name));
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(filePath));
  }

  async writeBuffer(filePath: string, data: Buffer): Promise<void> {
    const fullPath = this.resolve(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async listAllFiles(dirPath: string): Promise<Array<{ name: string; relativePath: string; size: number; modifiedAt: Date }>> {
    const fullPath = this.resolve(dirPath);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const results: Array<{ name: string; relativePath: string; size: number; modifiedAt: Date }> = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const rel = this.join(dirPath, entry.name);
      const stats = await fs.stat(this.resolve(rel));
      results.push({ name: entry.name, relativePath: rel, size: stats.size, modifiedAt: stats.mtime });
    }
    return results;
  }

  // --- Path Utilities ---

  join(...segments: string[]): string {
    return path.join(...segments);
  }

  basename(filePath: string): string {
    return path.basename(filePath);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  normalizeSlug(relativePath: string, ext: string): string {
    return relativePath.replace(ext, "").split(path.sep).join("/");
  }
}
