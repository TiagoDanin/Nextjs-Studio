/**
 * @context  UI layer — API service at src/cli/ui/services/media-api.ts
 * @does     Handles all HTTP communication with the media API endpoints
 * @depends  none (uses native fetch)
 * @do       Add new media-related API calls here
 * @dont     Import UI components, access filesystem, or contain rendering logic
 */

import type { MediaAsset } from "@shared/types";

export async function fetchMediaAssets(collection: string): Promise<MediaAsset[]> {
  const response = await fetch(`/api/media/${collection}`);
  if (!response.ok) return [];
  return response.json();
}

export async function uploadMediaFile(
  file: File,
  collection: string,
): Promise<MediaAsset | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(`/api/media/${collection}`, { method: "POST", body: formData });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
