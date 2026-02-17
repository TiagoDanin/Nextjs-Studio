import path from "node:path";
import { CONTENTS_DIR } from "@shared/constants";

export function getContentsDir(): string {
  return process.env.STUDIO_CONTENTS_DIR ?? path.resolve(process.cwd(), CONTENTS_DIR);
}
