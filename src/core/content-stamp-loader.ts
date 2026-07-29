/**
 * @context  Core layer — webpack loader at src/core/content-stamp-loader.ts
 * @does     Appends a hash of the contents directory to the studio server module
 * @depends  none
 * @do       Register through withStudio(); it is wired automatically in dev
 * @dont     Use in production builds; the stamp exists only to drive hot reload
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

interface LoaderContext {
  addContextDependency(directory: string): void;
  cacheable?(flag: boolean): void;
  getOptions?(): { contentsDir?: string };
  query?: string | { contentsDir?: string };
}

const MAX_ENTRIES = 5_000;

/**
 * Cheap fingerprint of the tree: path, size and mtime of every file. Reading the
 * bytes would be more precise but this runs on every rebuild, and an editor save
 * always moves mtime.
 */
function fingerprint(dir: string): string {
  const hash = crypto.createHash("sha1");
  let seen = 0;

  const walk = (current: string): void => {
    if (seen >= MAX_ENTRIES) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (seen >= MAX_ENTRIES) return;
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      try {
        const stat = fs.statSync(full);
        hash.update(`${full}:${stat.size}:${stat.mtimeMs}\n`);
        seen += 1;
      } catch {
        // file vanished mid-walk, nothing to stamp
      }
    }
  };

  walk(dir);
  return hash.digest("hex").slice(0, 16);
}

/**
 * Content files are read through fs, so they never enter the module graph and a
 * rebuild produces byte-identical output. Next only tells the browser to
 * re-render when a server module hash actually changes, so without a stamp the
 * open tab keeps showing stale content.
 *
 * Appending the fingerprint makes the module change whenever the contents
 * directory does, which is what turns a save into a refresh.
 */
function contentStampLoader(this: LoaderContext, source: string): string {
  const options = this.getOptions?.() ?? (typeof this.query === "object" ? this.query : {});
  const dir = options.contentsDir;

  if (!dir) return source;

  this.addContextDependency(dir);

  return `${source}\n// nextjs-studio:content-stamp ${fingerprint(dir)}\n`;
}

export default contentStampLoader;
