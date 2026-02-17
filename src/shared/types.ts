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
  /** Import/sync scripts for the collection */
  scripts?: {
    import?: string;
    sync?: string;
  };
}

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
 * Event emitted by the file watcher when content changes.
 */
export interface WatchEvent {
  type: "add" | "change" | "delete";
  collection: string;
  slug: string;
  extension: string;
  filePath: string;
}
