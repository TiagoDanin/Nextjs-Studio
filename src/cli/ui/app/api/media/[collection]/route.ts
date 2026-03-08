import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@cli/adapters/fs-adapter";
import { getContentsDir } from "@/lib/env";
import { MEDIA_DIR, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, AUDIO_EXTENSIONS } from "@shared/constants";
import type { MediaAsset } from "@shared/types";

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
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
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

function kindFromExt(ext: string): "image" | "video" | "audio" | "file" {
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())) return "image";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())) return "video";
  if ((AUDIO_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())) return "audio";
  return "file";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  const contentsDir = getContentsDir();
  const fs = new FsAdapter(contentsDir);
  const mediaDir = path.join(collection, MEDIA_DIR);

  const files = await fs.listAllFiles(mediaDir);

  const assets: MediaAsset[] = files.map((f) => {
    const ext = path.extname(f.name);
    return {
      name: f.name,
      path: f.relativePath,
      url: `/api/media/${collection}/${encodeURIComponent(f.name)}`,
      size: f.size,
      mimeType: mimeFromExt(ext),
      kind: kindFromExt(ext),
      modifiedAt: f.modifiedAt.toISOString(),
    };
  });

  return NextResponse.json(assets);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const contentsDir = getContentsDir();
  const fs = new FsAdapter(contentsDir);
  const destPath = path.join(collection, MEDIA_DIR, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeBuffer(destPath, buffer);

  const ext = path.extname(safeName);
  const asset: MediaAsset = {
    name: safeName,
    path: destPath,
    url: `/api/media/${collection}/${encodeURIComponent(safeName)}`,
    size: buffer.length,
    mimeType: mimeFromExt(ext),
    kind: kindFromExt(ext),
    modifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(asset, { status: 201 });
}
