/**
 * @context  Core layer — content writer at src/core/content-writer.ts
 * @does     Writes MDX and JSON content files using the IFsAdapter interface
 * @depends  src/shared/fs-adapter.interface.ts, src/core/parsers/parser-mdx.ts
 * @do       Add new write operations here for other content formats
 * @dont     Import FsAdapter directly from CLI; access the filesystem without going through IFsAdapter
 */

import type { IFsAdapter } from "../shared/fs-adapter.interface.js";
import { serializeMdx } from "./parsers/parser-mdx.js";

export async function writeJsonFile(
  fs: IFsAdapter,
  filePath: string,
  content: string,
): Promise<void> {
  await fs.writeFile(filePath, content + "\n");
}

export async function writeMdxEntries(
  fs: IFsAdapter,
  sources: {
    filePath: string;
    frontmatter: Record<string, unknown>;
    body: string;
  }[],
): Promise<void> {
  for (const { filePath, frontmatter, body } of sources) {
    if (!filePath) continue;
    await fs.writeFile(filePath, serializeMdx(frontmatter, body));
  }
}
