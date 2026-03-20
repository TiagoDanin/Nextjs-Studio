/**
 * @context  Core layer — filesystem adapter at src/core/fs-adapter.ts
 * @does     Implements IFsAdapter; abstracts all file read/write/list operations behind a single interface
 * @depends  src/shared/types.ts, src/shared/constants.ts, src/shared/fs-adapter.interface.ts
 * @do       Add new I/O operations here; all file access must go through this adapter
 * @dont     Import UI components, run HTTP requests, or contain business logic
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import type { Dirent } from "node:fs";
import type { FileInfo, DirectoryFileEntry } from "../shared/types.js";
import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import { SUPPORTED_EXTENSIONS } from "../shared/constants.js";

export class FsAdapter implements IFsAdapter {
  private readonly basePath: string;

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
    return { path: filePath, size: stats.size, modifiedAt: stats.mtime };
  }

  async listFiles(dirPath: string, extensions?: readonly string[]): Promise<string[]> {
    const fullPath = this.resolve(dirPath);
    const filterExts = extensions ?? SUPPORTED_EXTENSIONS;

    let entries: Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isFile() && filterExts.some((ext) => entry.name.endsWith(ext)))
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

  async listAllFiles(dirPath: string): Promise<DirectoryFileEntry[]> {
    const fullPath = this.resolve(dirPath);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const results: DirectoryFileEntry[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const relativePath = this.join(dirPath, entry.name);
      const stats = await fs.stat(this.resolve(relativePath));
      results.push({ name: entry.name, relativePath, size: stats.size, modifiedAt: stats.mtime });
    }
    return results;
  }

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

  readFileSync(filePath: string): string {
    return fsSync.readFileSync(this.resolve(filePath), "utf-8");
  }

  existsSync(filePath: string): boolean {
    return fsSync.existsSync(this.resolve(filePath));
  }

  listFilesSync(dirPath: string, extensions?: readonly string[]): string[] {
    const fullPath = this.resolve(dirPath);
    const filterExts = extensions ?? SUPPORTED_EXTENSIONS;

    let entries: Dirent[];
    try {
      entries = fsSync.readdirSync(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isFile() && filterExts.some((ext) => entry.name.endsWith(ext)))
      .map((entry) => this.join(dirPath, entry.name));
  }

  listDirectoriesSync(dirPath: string): string[] {
    const fullPath = this.resolve(dirPath);

    let entries: Dirent[];
    try {
      entries = fsSync.readdirSync(fullPath, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => this.join(dirPath, entry.name));
  }
}
