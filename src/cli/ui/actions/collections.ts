"use server";

/**
 * @context  Server actions for the UI layer (cli/ui/actions), executed on the Next.js server side.
 * @does     Loads, queries, and persists content collections by delegating to the core content engine.
 * @depends  @core/content-store, @core/content-writer, @core/schema-inferrer, @cli/adapters/fs-adapter, lib/env.
 * @do       Add new server actions that read or write content through the core API.
 * @dont     Never import client components or use browser APIs here — this is server-only code.
 */

import { loadContent } from "@core/content-store";
import { loadConfigFromPath } from "@core/config-loader";
import { loadComponentRegistry } from "@core/component-registry";
import { writeJsonFile, writeMdxEntries } from "@core/content-writer.js";
import { inferSchema } from "@core/schema-inferrer.js";
import { fieldLabel } from "@shared/field-utils.js";
import { FsAdapter } from "@core/fs-adapter";
import { getContentsDir, getConfigPath } from "../lib/env";
import type { ContentEntry, StudioConfig } from "@shared/types";
import type { FieldDefinition } from "@shared/fields";

async function loadConfigForUI(): Promise<StudioConfig> {
  const configPath = getConfigPath();
  if (!configPath) return {};
  return loadConfigFromPath(configPath);
}

export interface CollectionSummary {
  name: string;
  type: "mdx" | "json-array" | "json-object";
  count: number;
  /** Number of form sections — only set for json-object collections. */
  sectionCount?: number;
  basePath: string;
  /** Schema field definitions, populated when entry data is loaded. */
  fields?: FieldDefinition[];
}

function countFormSections(data: Record<string, unknown>): number {
  let hasFlatEntries = false;
  let objectCount = 0;
  for (const value of Object.values(data)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      objectCount++;
    } else {
      hasFlatEntries = true;
    }
  }
  return (hasFlatEntries ? 1 : 0) + objectCount;
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
    const config = await loadConfigForUI();
    const store = await loadContent(new FsAdapter(contentsDir), config);

    return store.getCollections().map((collection) => {
      const base = { name: collection.name, type: collection.type, count: collection.count, basePath: collection.basePath };
      if (collection.type === "json-object") {
        const data = store.getCollection(collection.name)[0]?.data ?? {};
        return { ...base, sectionCount: countFormSections(data) };
      }
      return base;
    });
  } catch {
    return [];
  }
}

export async function getCollectionEntries(
  name: string,
): Promise<CollectionEntriesResult | null> {
  try {
    const contentsDir = getContentsDir();
    const config = await loadConfigForUI();
    const store = await loadContent(new FsAdapter(contentsDir), config);
    const collections = store.getCollections();
    const col = collections.find((collection) => collection.name === name);

    if (!col) return null;

    const entries: ContentEntry[] = store.getCollection(name);

    const fs = new FsAdapter(contentsDir);
    const files = await fs.listFiles(col.basePath);
    const jsonFile = files.find((file) => file.endsWith(".json"));

    let rawJson = "";
    let filePath = "";
    if (jsonFile) {
      rawJson = await fs.readFile(jsonFile);
      filePath = jsonFile;
    }

    const schema = inferSchema(entries, col.name);
    // Ensure every field has a resolved label so consumers never need to compute it.
    const fields: FieldDefinition[] = schema.fields.map((field) => ({
      ...field,
      label: fieldLabel(field),
    }));

    return {
      collection: {
        name: col.name,
        type: col.type,
        count: col.count,
        basePath: col.basePath,
        fields,
      },
      entries: entries.map((entry) => ({
        collection: entry.collection,
        slug: entry.slug,
        path: entry.path,
        filePath:
          col.type === "mdx" ? fs.join(col.basePath, entry.slug + ".mdx") : "",
        body: entry.body,
        data: entry.data,
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
    const config = await loadConfigForUI();
    const store = await loadContent(new FsAdapter(contentsDir), config);
    const entries: ContentEntry[] = store.getCollection(collectionName);
    const entry = entries.find((entry) => entry.slug === slug);
    if (!entry) return null;

    const collections = store.getCollections();
    const col = collections.find((collection) => collection.name === collectionName);
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

export async function getCollectionScripts(
  name: string,
): Promise<{ sync?: string }> {
  try {
    const config = await loadConfigForUI();
    return config.collections?.[name]?.scripts ?? {};
  } catch {
    return {};
  }
}

export async function getComponentRegistry() {
  const config = await loadConfigForUI();
  return loadComponentRegistry(config);
}
