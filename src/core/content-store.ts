import { CONTENTS_DIR } from "../shared/constants.js";
import { ContentIndex } from "./indexer.js";

let store: ContentIndex | null = null;

export function getStore(): ContentIndex {
  if (!store) {
    throw new Error(
      "Content not loaded. Call loadContent() before querying.",
    );
  }
  
  return store;
}

export async function loadContent(contentsDir?: string): Promise<ContentIndex> {
  const idx = new ContentIndex();
  await idx.build(contentsDir ?? CONTENTS_DIR);
  store = idx;
  return idx;
}
