"use server";

import { loadContent } from "@core/content-store";
import { getContentsDir } from "../lib/env";

export interface CollectionSummary {
  name: string;
  type: "mdx" | "json-array" | "json-object";
  count: number;
}

export async function getCollections(): Promise<CollectionSummary[]> {
  try {
    const contentsDir = getContentsDir();
    const store = await loadContent(contentsDir);

    return store.getCollections().map((c) => ({
      name: c.name,
      type: c.type,
      count: c.count,
    }));
  } catch {
    return [];
  }
}
