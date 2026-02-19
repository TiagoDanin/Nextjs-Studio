import { FsAdapter } from "../cli/adapters/fs-adapter.js";
import { serializeMdx } from "./parsers/parser-mdx.js";

export async function writeJsonFile(
  fs: FsAdapter,
  filePath: string,
  content: string,
): Promise<void> {
  await fs.writeFile(filePath, content + "\n");
}

export async function writeMdxEntries(
  fs: FsAdapter,
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
