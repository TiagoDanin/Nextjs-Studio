/**
 * @context  API route for serving a single media file (cli/ui/app/api/media/[collection]/[filename]).
 * @does     GET reads the binary file from the collection's media folder and returns it with the correct MIME type.
 *           When `mediaDir` is configured, reads from `{projectDir}/{mediaDir}/` instead of the default `_media` folder.
 * @depends  @cli/adapters/fs-adapter for file I/O, lib/env for dirs, actions/collections for media config.
 * @do       Add cache headers or ETag support for better media caching.
 * @dont     Never allow path traversal outside the configured media directory.
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@core/fs-adapter";
import { getContentsDir, getProjectDir } from "@/lib/env";
import { MEDIA_DIR } from "@shared/constants";
import { mimeFromExtension } from "@/lib/media-types";
import { getCollectionMediaConfig } from "@/lib/media-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string; filename: string }> },
) {
  const { collection, filename } = await params;

  // Prevent path traversal
  const safeName = path.basename(decodeURIComponent(filename));
  const { mediaDir } = await getCollectionMediaConfig(collection);

  let fs: FsAdapter;
  let filePath: string;

  if (mediaDir) {
    fs = new FsAdapter(getProjectDir());
    filePath = path.join(mediaDir, safeName);
  } else {
    fs = new FsAdapter(getContentsDir());
    filePath = path.join(collection, MEDIA_DIR, safeName);
  }

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
