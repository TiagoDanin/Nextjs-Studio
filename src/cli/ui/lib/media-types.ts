/**
 * @context  UI lib — MIME type utilities at src/cli/ui/lib/media-types.ts
 * @does     Maps file extensions to MIME types and media kind categories
 * @depends  IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, AUDIO_EXTENSIONS from @shared/constants
 * @do       Add new extension-to-MIME mappings here
 * @dont     Put upload logic or filesystem I/O here
 */

import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
} from "@shared/constants";

export const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/aac",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
};

export function mimeFromExtension(extension: string): string {
  return MIME_MAP[extension.toLowerCase()] ?? "application/octet-stream";
}

export function kindFromExtension(
  extension: string,
): "image" | "video" | "audio" | "file" {
  const lower = extension.toLowerCase();
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(lower)) return "image";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(lower)) return "video";
  if ((AUDIO_EXTENSIONS as readonly string[]).includes(lower)) return "audio";
  return "file";
}
