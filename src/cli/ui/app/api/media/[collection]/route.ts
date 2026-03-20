/**
 * @context  API route for a collection's media directory (cli/ui/app/api/media/[collection]).
 * @does     GET lists all media assets; POST accepts a file upload and writes it to the collection's _media folder.
 * @depends  @cli/adapters/fs-adapter for file I/O, lib/env for contents dir, @shared/constants for media paths.
 * @do       Add DELETE support or metadata endpoints for media assets here.
 * @dont     Never serve or mutate files outside the collection's _media directory.
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@core/fs-adapter";
import { getContentsDir } from "@/lib/env";
import { MEDIA_DIR } from "@shared/constants";
import type { MediaAsset } from "@shared/types";
import { mimeFromExtension, kindFromExtension } from "@/lib/media-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  const contentsDir = getContentsDir();
  const fs = new FsAdapter(contentsDir);
  const mediaDir = path.join(collection, MEDIA_DIR);

  const files = await fs.listAllFiles(mediaDir);

  const assets: MediaAsset[] = files.map((file) => {
    const ext = path.extname(file.name);
    return {
      name: file.name,
      path: file.relativePath,
      url: `/api/media/${collection}/${encodeURIComponent(file.name)}`,
      size: file.size,
      mimeType: mimeFromExtension(ext),
      kind: kindFromExtension(ext),
      modifiedAt: file.modifiedAt.toISOString(),
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
    mimeType: mimeFromExtension(ext),
    kind: kindFromExtension(ext),
    modifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(asset, { status: 201 });
}
