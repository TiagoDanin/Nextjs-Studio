/**
 * @context  Core layer — content indexer at src/core/indexer.ts
 * @does     Scans the contents directory, parses MDX/JSON files, and builds an in-memory index
 * @depends  src/shared/types.ts, src/shared/constants.ts, src/shared/fs-adapter.interface.ts, src/core/parsers/, src/core/schema-inferrer.ts
 * @do       Add new file type handling here; extend indexCollection for new collection behaviors
 * @dont     Import from CLI or UI; instantiate FsAdapter; access the filesystem directly
 */

import slugify from "@sindresorhus/slugify";
import type { CollectionSchema } from "../shared/fields.js";
import type { ContentEntry, Collection, StudioConfig } from "../shared/types.js";
import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import { COLLECTION_ORDER_FILE } from "../shared/constants.js";
import { parseMdx } from "./parsers/parser-mdx.js";
import { parseJson } from "./parsers/parser-json.js";
import { inferSchema } from "./schema-inferrer.js";

export class ContentIndex {
  private readonly entries = new Map<string, ContentEntry[]>();
  private readonly collections = new Map<string, Collection>();
  private readonly fs: IFsAdapter;

  constructor(fsAdapter: IFsAdapter) {
    this.fs = fsAdapter;
  }

  async build(config?: StudioConfig): Promise<void> {
    this.clear();
    const dirs = await this.fs.listDirectories(".");

    for (const dir of dirs) {
      const dirName = this.fs.basename(dir);
      const collectionName = slugify(dirName);
      const collectionConfig = config?.collections?.[collectionName];
      await this.indexCollection(dirName, collectionName, collectionConfig?.schema);
    }
  }

  getCollection(name: string): ContentEntry[] {
    return this.entries.get(name) ?? [];
  }

  getCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  clear(): void {
    this.entries.clear();
    this.collections.clear();
  }

  private async indexCollection(
    dirName: string,
    collectionName: string,
    manualSchema?: CollectionSchema,
  ): Promise<void> {
    const entries: ContentEntry[] = [];
    await this.scanDir(dirName, collectionName, dirName, entries);

    const orderPath = this.fs.join(dirName, COLLECTION_ORDER_FILE);
    const ordering = await this.readOrdering(orderPath);
    if (ordering) {
      this.applyOrdering(entries, ordering);
    }

    const schema = manualSchema ?? inferSchema(entries, collectionName);

    this.entries.set(collectionName, entries);
    this.collections.set(collectionName, {
      name: collectionName,
      type: this.detectCollectionType(entries),
      count: entries.length,
      basePath: dirName,
      schema,
    });
  }

  private async scanDir(
    dirName: string,
    collectionName: string,
    dirPath: string,
    entries: ContentEntry[],
  ): Promise<void> {
    const subDirs = await this.fs.listDirectories(dirPath);
    for (const subDir of subDirs) {
      await this.scanDir(dirName, collectionName, subDir, entries);
    }

    const files = await this.fs.listFiles(dirPath);
    for (const filePath of files) {
      const fileName = this.fs.basename(filePath);
      if (fileName === COLLECTION_ORDER_FILE) continue;

      const ext = this.fs.extname(fileName);
      const content = await this.fs.readFile(filePath);
      const relativePath = this.fs.relative(dirName, filePath);
      const slug = this.fs
        .normalizeSlug(relativePath, ext)
        .split("/")
        .map((segment) => slugify(segment))
        .join("/");

      if (ext === ".mdx") {
        entries.push(this.buildMdxEntry(collectionName, slug, content));
      } else if (ext === ".json") {
        entries.push(...this.buildJsonEntries(collectionName, slug, content));
      }
    }
  }

  private buildMdxEntry(collectionName: string, slug: string, content: string): ContentEntry {
    const parsed = parseMdx(content);
    return {
      collection: collectionName,
      slug,
      path: `/${collectionName}/${slug}`,
      body: parsed.body,
      data: parsed.data,
    };
  }

  private buildJsonEntries(collectionName: string, slug: string, content: string): ContentEntry[] {
    const parsed = parseJson(content);

    if (parsed.type === "json-array") {
      return parsed.entries.map((data, index) => {
        const entrySlug =
          typeof data["slug"] === "string" ? slugify(data["slug"]) : `${slug}/${index}`;
        return {
          collection: collectionName,
          slug: entrySlug,
          path: `/${collectionName}/${entrySlug}`,
          data,
        };
      });
    }

    return [{ collection: collectionName, slug, path: `/${collectionName}/${slug}`, data: parsed.data }];
  }

  private async readOrdering(orderPath: string): Promise<string[] | null> {
    if (!(await this.fs.exists(orderPath))) return null;

    try {
      const content = await this.fs.readFile(orderPath);
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch (error) {
      console.warn(`[Nextjs Studio] Failed to parse ordering file: ${orderPath}`, error);
    }
    return null;
  }

  private applyOrdering(entries: ContentEntry[], ordering: string[]): void {
    const orderMap = new Map(ordering.map((slug, index) => [slug, index]));
    entries.sort((a, b) => {
      const aIndex = orderMap.get(a.slug) ?? Infinity;
      const bIndex = orderMap.get(b.slug) ?? Infinity;
      return aIndex - bIndex;
    });
  }

  private detectCollectionType(entries: ContentEntry[]): Collection["type"] {
    if (entries.length === 0) return "mdx";
    const first = entries[0];
    if (first.body !== undefined) return "mdx";
    if (entries.length === 1 && !first.slug.includes("/")) return "json-object";
    return "json-array";
  }
}
