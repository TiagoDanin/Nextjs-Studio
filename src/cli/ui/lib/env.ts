/**
 * @context  Environment helper in the UI lib layer (cli/ui/lib), used by server actions and API routes.
 * @does     Resolves the absolute path to the contents directory from env vars or defaults.
 * @depends  @shared/constants for the default CONTENTS_DIR value.
 * @do       Add new environment resolution helpers that the server side of the UI needs.
 * @dont     Never import client-only code or React here — this runs on the server.
 */

import path from "node:path";
import { CONTENTS_DIR } from "@shared/constants";

export function getContentsDir(): string {
  return process.env.STUDIO_CONTENTS_DIR ?? path.resolve(process.cwd(), CONTENTS_DIR);
}
