import slugify from "@sindresorhus/slugify";
import type { ContentEntry, Collection } from "../shared/types.js";
import { COLLECTION_ORDER_FILE } from "../shared/constants.js";
import { FsAdapter } from "../cli/adapters/fs-adapter.js";
import { parseMdx } from "./parsers/parser-mdx.js";
import { parseJson } from "./parsers/parser-json.js";

export class ContentIndex {
  private entries = new Map<string, ContentEntry[]>();
  private collections = new Map<string, Collection>();
  private fs!: FsAdapter;

  async build(contentsDir: string): Promise<void> {
    this.clear();
    this.fs = new FsAdapter(contentsDir);

    const dirs = await this.fs.listDirectories(".");

    for (const dir of dirs) {
      const dirName = this.fs.basename(dir);
      const collectionName = slugify(dirName);
      await this.indexCollection(dirName, collectionName);
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

  private async indexCollection(dirName: string, collectionName: string): Promise<void> {
    const entries: ContentEntry[] = [];

    await this.scanDir(dirName, collectionName, dirName, entries);

    const orderPath = this.fs.join(dirName, COLLECTION_ORDER_FILE);
    const ordering = await this.readOrdering(orderPath);
    if (ordering) {
      this.applyOrdering(entries, ordering);
    }

    const collectionType = this.detectCollectionType(entries);

    this.entries.set(collectionName, entries);
    this.collections.set(collectionName, {
      name: collectionName,
      type: collectionType,
      count: entries.length,
      basePath: dirName,
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
      const rawSlug = this.fs.normalizeSlug(relativePath, ext);
      const slug = rawSlug
        .split("/")
        .map((segment) => slugify(segment))
        .join("/");
      const contentPath = `/${collectionName}/${slug}`;

      if (ext === ".mdx") {
        const parsed = parseMdx(content);
        entries.push({
          collection: collectionName,
          slug,
          path: contentPath,
          body: parsed.body,
          data: parsed.data,
        });
      } else if (ext === ".json") {
        const parsed = parseJson(content);

        if (parsed.type === "json-array") {
          for (let i = 0; i < parsed.entries.length; i++) {
            const entryData = parsed.entries[i];
            const entrySlug =
              typeof entryData["slug"] === "string"
                ? slugify(entryData["slug"])
                : `${slug}/${i}`;

            entries.push({
              collection: collectionName,
              slug: entrySlug,
              path: `/${collectionName}/${entrySlug}`,
              data: entryData,
            });
          }
        } else {
          entries.push({
            collection: collectionName,
            slug,
            path: contentPath,
            data: parsed.data,
          });
        }
      }
    }
  }

  private async readOrdering(orderPath: string): Promise<string[] | null> {
    if (!(await this.fs.exists(orderPath))) return null;

    try {
      const content = await this.fs.readFile(orderPath);
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
    } catch (error) {
      console.warn(`[nextjs-studio] Failed to parse ordering file: ${orderPath}`, error);
    }
    return null;
  }

  private applyOrdering(entries: ContentEntry[], ordering: string[]): void {
    const orderMap = new Map(ordering.map((slug, i) => [slug, i]));
    entries.sort((a, b) => {
      const aIndex = orderMap.get(a.slug) ?? Infinity;
      const bIndex = orderMap.get(b.slug) ?? Infinity;
      return aIndex - bIndex;
    });
  }

  private detectCollectionType(
    entries: ContentEntry[],
  ): Collection["type"] {
    if (entries.length === 0) return "mdx";

    const first = entries[0];
    if (first.body !== undefined) return "mdx";

    if (entries.length === 1 && !first.slug.includes("/")) {
      return "json-object";
    }

    return "json-array";
  }
}
