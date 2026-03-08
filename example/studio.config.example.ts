/**
 * Example studio.config.ts
 *
 * Copy this file to your project root as `studio.config.ts` and
 * adjust collections/fields to match your content structure.
 */

import type { StudioConfig } from "../src/core/index.js";
import { blogSchema } from "./schemas/blog.js";
import { authorsSchema } from "./schemas/authors.js";

const config: StudioConfig = {
  collections: {
    blog: {
      schema: blogSchema,
      scripts: {
        import: "node scripts/import-posts.js",
        sync: "node scripts/sync-posts.js",
      },
    },
    authors: {
      schema: authorsSchema,
    },
  },
};

export default config;
