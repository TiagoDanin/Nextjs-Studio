import fs from "node:fs/promises";
import path from "node:path";
import type { FileInfo } from "../../shared/types.js";
import { SUPPORTED_EXTENSIONS } from "../../shared/constants.js";

type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export class FsAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  private resolve(...segments: string[]): string {
    return path.resolve(this.basePath, ...segments);
  }

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
      .map((entry) => path.join(dirPath, entry.name));
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    const fullPath = this.resolve(dirPath);

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(dirPath, entry.name));
  }
}
