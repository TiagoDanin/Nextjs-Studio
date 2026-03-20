/**
 * @context  API route for serving files from the consumer project's public directory.
 * @does     GET reads a file from `{projectDir}/public/{path}` and returns it with the correct MIME type.
 *           This allows the studio to serve images that are stored in the consumer project's public folder
 *           (e.g. `/images/posts/cover.jpg` → reads `<projectRoot>/public/images/posts/cover.jpg`).
 *           This route is reached via the fallback rewrite in next.config.ts for paths not handled by the studio.
 * @depends  @cli/adapters/fs-adapter, lib/env for projectDir, lib/media-types for MIME.
 * @do       This is intentionally a broad pass-through — all path safety is enforced by FsAdapter's root.
 * @dont     Never allow paths that escape the public directory.
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@core/fs-adapter";
import { getProjectDir } from "@/lib/env";
import { mimeFromExtension } from "@/lib/media-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;

  // Reject any segment containing ".." to prevent traversal
  if (parts.some((p) => p.includes(".."))) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = path.join("public", ...parts);
  const fs = new FsAdapter(getProjectDir());

  let buffer: Buffer;
  try {
    buffer = await fs.readBuffer(filePath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(parts[parts.length - 1] ?? "").toLowerCase();
  const contentType = mimeFromExtension(ext);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
