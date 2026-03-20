/**
 * @context  API route for serving a single media file (cli/ui/app/api/media/[collection]/[filename]).
 * @does     GET reads the binary file from the collection's _media folder and returns it with the correct MIME type.
 * @depends  @cli/adapters/fs-adapter for file I/O, lib/env for contents dir, @shared/constants for MEDIA_DIR.
 * @do       Add cache headers or ETag support for better media caching.
 * @dont     Never allow path traversal outside the collection's _media directory.
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@core/fs-adapter";
import { getContentsDir } from "@/lib/env";
import { MEDIA_DIR } from "@shared/constants";
import { mimeFromExtension } from "@/lib/media-types";

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
  const contentType = mimeFromExtension(ext);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
