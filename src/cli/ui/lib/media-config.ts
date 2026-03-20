/**
 * @context  UI lib — media config helper at src/cli/ui/lib/media-config.ts
 * @does     Resolves per-collection media directory config for use in API routes and server actions.
 * @depends  @core/config-loader, lib/env
 * @do       Import this in API routes that need to know where media files live.
 * @dont     Never import client components or browser APIs here.
 */

import { loadConfigFromPath } from "@core/config-loader";
import { getConfigPath } from "./env";

export interface CollectionMediaConfig {
  /** Absolute FS path root (e.g. projectDir when mediaDir is set, contentsDir otherwise) */
  mediaDir?: string;
  /** URL prefix for the media, e.g. "/images/posts" */
  urlPrefix?: string;
}

/**
 * Returns mediaDir and derived urlPrefix for a collection, or empty object when not configured.
 * `mediaDir` is the path relative to the project root (e.g. "public/images/posts").
 * `urlPrefix` is the public URL prefix (e.g. "/images/posts").
 */
export async function getCollectionMediaConfig(
  collection: string,
): Promise<CollectionMediaConfig> {
  try {
    const configPath = getConfigPath();
    if (!configPath) return {};
    const config = await loadConfigFromPath(configPath);
    const mediaDir = config.collections?.[collection]?.mediaDir;
    if (!mediaDir) return {};
    const urlPrefix = "/" + mediaDir.replace(/^public\//, "");
    return { mediaDir, urlPrefix };
  } catch {
    return {};
  }
}
