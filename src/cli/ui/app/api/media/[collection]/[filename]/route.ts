import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@cli/adapters/fs-adapter";
import { getContentsDir } from "@/lib/env";
import { MEDIA_DIR } from "@shared/constants";

const MIME_MAP: Record<string, string> = {
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string; filename: string }> },
) {
  const { collection, filename } = await params;

  // Prevent path traversal
  const safeName = path.basename(decodeURIComponent(filename));
  const contentsDir = getContentsDir();
  const fs = new FsAdapter(contentsDir);
  const filePath = path.join(collection, MEDIA_DIR, safeName);

  let buffer: Buffer;
  try {
    buffer = await fs.readBuffer(filePath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
