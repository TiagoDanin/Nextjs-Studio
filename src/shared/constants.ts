/** Default directory for content files */
export const CONTENTS_DIR = "contents";

/** Default port for the CLI server */
export const CLI_PORT = 3030;

/** Default config filename */
export const CONFIG_FILE = "studio.config.ts";

/** Supported content file extensions */
export const SUPPORTED_EXTENSIONS = [".mdx", ".json"] as const;

/** Collection ordering file name */
export const COLLECTION_ORDER_FILE = "collection.json";

/** Debounce interval for file watcher events (ms) */
export const WATCHER_DEBOUNCE_MS = 5_000;

/** Subdirectory inside each collection folder that stores media assets */
export const MEDIA_DIR = "media";

/** MIME types treated as images */
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
] as const;

/** MIME types treated as videos */
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
] as const;

/** MIME types treated as audio */
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
] as const;

/** All accepted media MIME types */
export const MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES] as const;

/** File extensions for images */
export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"] as const;

/** File extensions for videos */
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogv"] as const;

/** File extensions for audio */
export const AUDIO_EXTENSIONS = [".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac"] as const;
