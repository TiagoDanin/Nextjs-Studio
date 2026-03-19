/**
 * @context  Shared layer — constants at src/shared/constants.ts
 * @does     Defines project-wide constants shared across core, CLI, and UI layers
 * @depends  none
 * @do       Add new shared constants here
 * @dont     Import from CLI or UI; constants must be framework-agnostic
 */

export const CONTENTS_DIR = "contents";
export const CLI_PORT = 3030;
export const CONFIG_FILE = "studio.config.ts";
export const CONFIG_FILENAMES = ["studio.config.ts", "studio.config.js", "studio.config.mjs"] as const;
export const SUPPORTED_EXTENSIONS = [".mdx", ".json"] as const;
export const COLLECTION_ORDER_FILE = "collection.json";
export const WATCHER_DEBOUNCE_MS = 5_000;
export const MEDIA_DIR = "media";

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
] as const;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/ogg"] as const;

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
] as const;

export const MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES] as const;

export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"] as const;
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogv"] as const;
export const AUDIO_EXTENSIONS = [".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac"] as const;
