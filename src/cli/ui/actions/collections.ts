"use server";

import { loadContent } from "@core/content-store";
import { writeJsonFile, writeMdxEntries } from "@core/content-writer.js";
import { FsAdapter } from "@cli/adapters/fs-adapter";
import { getContentsDir } from "../lib/env";
import type { ContentEntry } from "@shared/types";

export interface CollectionSummary {
  name: string;
  type: "mdx" | "json-array" | "json-object";
  count: number;
  basePath: string;
}

export interface CollectionEntriesResult {
  collection: CollectionSummary;
  entries: SerializableEntry[];
  rawJson: string;
  filePath: string;
}

export interface SerializableEntry {
  collection: string;
  slug: string;
  path: string;
  filePath: string;
  body?: string;
  data: Record<string, unknown>;
}

export async function getCollections(): Promise<CollectionSummary[]> {
  try {
    const contentsDir = getContentsDir();
    const store = await loadContent(contentsDir);

    return store.getCollections().map((c) => ({
      name: c.name,
      type: c.type,
      count: c.count,
      basePath: c.basePath,
    }));
  } catch {
    return [];
  }
}

export async function getCollectionEntries(
  name: string,
): Promise<CollectionEntriesResult | null> {
  try {
    const contentsDir = getContentsDir();
    const store = await loadContent(contentsDir);
    const collections = store.getCollections();
    const col = collections.find((c) => c.name === name);

    if (!col) return null;

    const entries: ContentEntry[] = store.getCollection(name);

    const fs = new FsAdapter(contentsDir);
    const files = await fs.listFiles(col.basePath);
    const jsonFile = files.find((f) => f.endsWith(".json"));

    let rawJson = "";
    let filePath = "";
    if (jsonFile) {
      rawJson = await fs.readFile(jsonFile);
      filePath = jsonFile;
    }

    return {
      collection: {
        name: col.name,
        type: col.type,
        count: col.count,
        basePath: col.basePath,
      },
      entries: entries.map((e) => ({
        collection: e.collection,
        slug: e.slug,
        path: e.path,
        filePath:
          col.type === "mdx" ? fs.join(col.basePath, e.slug + ".mdx") : "",
        body: e.body,
        data: e.data,
      })),
      rawJson,
      filePath,
    };
  } catch {
    return null;
  }
}

export async function getMdxEntry(
  collectionName: string,
  slug: string,
): Promise<{ filePath: string; frontmatter: Record<string, unknown>; body: string } | null> {
  try {
    const contentsDir = getContentsDir();
    const store = await loadContent(contentsDir);
    const entries: ContentEntry[] = store.getCollection(collectionName);
    const entry = entries.find((e) => e.slug === slug);
    if (!entry) return null;

    const collections = store.getCollections();
    const col = collections.find((c) => c.name === collectionName);
    if (!col) return null;

    const fs = new FsAdapter(contentsDir);
    const filePath = fs.join(col.basePath, slug + ".mdx");

    return {
      filePath,
      frontmatter: entry.data,
      body: entry.body ?? "",
    };
  } catch {
    return null;
  }
}

export async function saveCollectionJson(
  filePath: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fs = new FsAdapter(getContentsDir());
    await writeJsonFile(fs, filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function saveMdxFrontmatter(
  sources: {
    filePath: string;
    frontmatter: Record<string, unknown>;
    body: string;
  }[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const fs = new FsAdapter(getContentsDir());
    await writeMdxEntries(fs, sources);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
