/**
 * @context  Shared layer — domain types at src/shared/types.ts
 * @does     Defines core domain interfaces shared across core, CLI, and UI layers
 * @depends  src/shared/fields.ts
 * @do       Add new shared domain types here
 * @dont     Import from CLI or UI; contain runtime logic; import framework-specific code
 */

import type { CollectionSchema } from "./fields.js";

/**
 * Core content entry representing a single piece of content.
 */
export interface ContentEntry {
  /** Collection name derived from the parent folder */
  collection: string;
  /** URL-friendly identifier derived from the filename */
  slug: string;
  /** Full path relative to the contents directory */
  path: string;
  /** Raw body content (MDX string or undefined for JSON) */
  body?: string;
  /** Parsed frontmatter or JSON data */
  data: Record<string, unknown>;
  /** Locale code parsed from filename (e.g. "pt" from "post.pt.mdx") */
  locale?: string;
}

/**
 * Collection metadata describing a content collection.
 */
export interface Collection {
  /** Collection name (folder name) */
  name: string;
  /** Type of content in the collection */
  type: "mdx" | "json-array" | "json-object";
  /** Number of entries in the collection */
  count: number;
  /** Filesystem path to the collection folder */
  basePath: string;
  /** Optional schema that describes the fields in this collection. */
  schema?: CollectionSchema;
}

/**
 * Studio configuration from studio.config.ts
 */
export interface StudioConfig {
  /** Per-collection configuration */
  collections?: Record<string, CollectionConfig>;
}

/**
 * Per-collection configuration options.
 */
export interface CollectionConfig {
  /** Field schema that describes the shape of each entry. */
  schema?: CollectionSchema;
  /** Sync scripts for the collection */
  scripts?: {
    sync?: string;
  };
}

/**
 * Augmentable map of collection names to their typed entry shapes.
 * Extend this via generated types or manual declaration:
 *
 * @example
 * // .studio/studio.d.ts (auto-generated)
 * declare module 'nextjs-studio' {
 *   interface CollectionTypeMap {
 *     posts: { title: string; date: string; slug: string };
 *   }
 * }
 */
export interface CollectionTypeMap {}

/**
 * Query options for the content query builder.
 */
export interface QueryOptions {
  where?: Record<string, unknown>;
  sort?: { field: string; order: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

/**
 * File metadata returned by the FS adapter.
 */
export interface FileInfo {
  path: string;
  size: number;
  modifiedAt: Date;
}

/**
 * A file entry returned by a flat directory listing (non-recursive).
 */
export interface DirectoryFileEntry {
  name: string;
  relativePath: string;
  size: number;
  modifiedAt: Date;
}

/**
 * A media asset stored inside a collection's media folder.
 */
export interface MediaAsset {
  /** Original filename, e.g. "cover.png" */
  name: string;
  /** Relative path inside the contents directory, e.g. "blog/media/cover.png" */
  path: string;
  /** Public API URL to fetch the file, e.g. "/api/media/blog/cover.png" */
  url: string;
  /** File size in bytes */
  size: number;
  /** MIME type, e.g. "image/png" */
  mimeType: string;
  /** "image" | "video" | "audio" | "file" */
  kind: "image" | "video" | "audio" | "file";
  /** Last modification timestamp */
  modifiedAt: string;
}

/**
 * Event emitted by the file watcher when content changes.
 */
export interface WatchEvent {
  type: "add" | "change" | "delete";
  collection: string;
  slug: string;
  extension: string;
  filePath: string;
}
