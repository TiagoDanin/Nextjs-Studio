/**
 * @context  Shared layer — FS adapter interface at src/shared/fs-adapter.interface.ts
 * @does     Defines the IFsAdapter contract so Core can perform I/O without depending on CLI
 * @depends  src/shared/types.ts
 * @do       Add new I/O methods here when Core needs them; keep the interface minimal
 * @dont     Import from CLI or UI; contain implementation logic
 */

import type { FileInfo, DirectoryFileEntry } from "./types.js";

export interface IFsAdapter {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  getStats(filePath: string): Promise<FileInfo>;
  listFiles(dirPath: string, extensions?: readonly string[]): Promise<string[]>;
  listDirectories(dirPath: string): Promise<string[]>;
  readBuffer(filePath: string): Promise<Buffer>;
  writeBuffer(filePath: string, data: Buffer): Promise<void>;
  listAllFiles(dirPath: string): Promise<DirectoryFileEntry[]>;
  join(...segments: string[]): string;
  basename(filePath: string): string;
  extname(filePath: string): string;
  relative(from: string, to: string): string;
  normalizeSlug(relativePath: string, ext: string): string;

  // Sync variants used by the build-time indexer for auto-initialization
  readFileSync(filePath: string): string;
  existsSync(filePath: string): boolean;
  listFilesSync(dirPath: string, extensions?: readonly string[]): string[];
  listDirectoriesSync(dirPath: string): string[];
}
