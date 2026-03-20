/**
 * @context  API route for a collection's media directory (cli/ui/app/api/media/[collection]).
 * @does     GET lists all media assets; POST accepts a file upload and writes it to the collection's media folder.
 *           When `mediaDir` is configured for the collection, files go to `{projectDir}/{mediaDir}/` and the
 *           returned URL reflects the public path (e.g. `/images/posts/file.jpg`).
 * @depends  @cli/adapters/fs-adapter for file I/O, lib/env for dirs, actions/collections for media config.
 * @do       Add DELETE support or metadata endpoints for media assets here.
 * @dont     Never serve or mutate files outside the configured media directory.
 */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { FsAdapter } from "@core/fs-adapter";
import { getContentsDir, getProjectDir } from "@/lib/env";
import { MEDIA_DIR } from "@shared/constants";
import type { MediaAsset } from "@shared/types";
import { mimeFromExtension, kindFromExtension } from "@/lib/media-types";
import { getCollectionMediaConfig } from "@/lib/media-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  const { mediaDir, urlPrefix } = await getCollectionMediaConfig(collection);

  let fs: FsAdapter;
  let mediaFolderPath: string;
  let makeUrl: (name: string) => string;

  if (mediaDir) {
    fs = new FsAdapter(getProjectDir());
    mediaFolderPath = mediaDir;
    makeUrl = (name) => `${urlPrefix}/${encodeURIComponent(name)}`;
  } else {
    fs = new FsAdapter(getContentsDir());
    mediaFolderPath = path.join(collection, MEDIA_DIR);
    makeUrl = (name) => `/api/media/${collection}/${encodeURIComponent(name)}`;
  }

  const files = await fs.listAllFiles(mediaFolderPath);

  const assets: MediaAsset[] = files.map((file) => {
    const ext = path.extname(file.name);
    return {
      name: file.name,
      path: file.relativePath,
      url: makeUrl(file.name),
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
  const { mediaDir, urlPrefix } = await getCollectionMediaConfig(collection);

  let fs: FsAdapter;
  let destPath: string;
  let assetUrl: string;

  if (mediaDir) {
    fs = new FsAdapter(getProjectDir());
    destPath = path.join(mediaDir, safeName);
    assetUrl = `${urlPrefix}/${encodeURIComponent(safeName)}`;
  } else {
    fs = new FsAdapter(getContentsDir());
    destPath = path.join(collection, MEDIA_DIR, safeName);
    assetUrl = `/api/media/${collection}/${encodeURIComponent(safeName)}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeBuffer(destPath, buffer);

  const ext = path.extname(safeName);
  const asset: MediaAsset = {
    name: safeName,
    path: destPath,
    url: assetUrl,
    size: buffer.length,
    mimeType: mimeFromExtension(ext),
    kind: kindFromExtension(ext),
    modifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(asset, { status: 201 });
}
