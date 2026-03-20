# Configuration

Collections are auto-detected from `/contents`. No config file needed for basic usage.

Create `studio.config.ts` at your project root to add schemas or sync scripts.

## studio.config.ts

```ts
// studio.config.ts
import type { StudioConfig } from "nextjs-studio";

const config: StudioConfig = {
  collections: {
    blog: {
      schema: {
        collection: "blog",
        label: "Blog Posts",
        fields: [
          { name: "title",     type: "text",    required: true  },
          { name: "published", type: "boolean", defaultValue: false },
          { name: "date",      type: "date"                     },
        ],
      },
      scripts: {
        sync: "node scripts/sync-posts.js",
      },
    },
  },
};

export default config;
```

## Collection options

| Property | Type | Description |
|----------|------|-------------|
| `schema` | `CollectionSchema` | Field definitions. Used for validation, typed output, and editor inputs |
| `scripts.sync` | `string` | Shell command to sync with an external source. Triggered from the CMS UI |

## Schemas in separate files

For larger projects, keep schemas in their own files:

```ts
// studio.config.ts
import type { StudioConfig } from "nextjs-studio";
import { blogSchema } from "./schemas/blog";
import { authorsSchema } from "./schemas/authors";

const config: StudioConfig = {
  collections: {
    blog:    { schema: blogSchema    },
    authors: { schema: authorsSchema },
  },
};

export default config;
```

```ts
// schemas/blog.ts
import type { CollectionSchema } from "nextjs-studio";

export const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "title",       type: "text",      required: true },
    { name: "slug",        type: "slug",       from: "title" },
    { name: "excerpt",     type: "long-text",  rows: 3, required: false },
    { name: "coverImage",  type: "media",      accept: ["image/*"] },
    { name: "status",      type: "status",
      options: [
        { label: "Draft",     value: "draft",     color: "gray"  },
        { label: "Published", value: "published", color: "green" },
      ],
      defaultValue: "draft",
    },
    { name: "publishedAt", type: "date",       includeTime: true },
    { name: "author",      type: "relation",   collection: "authors" },
    { name: "createdAt",   type: "created-time" },
    { name: "updatedAt",   type: "updated-time" },
  ],
};
```

## Generate TypeScript types

After defining your schemas, generate a `.d.ts` file with fully-typed interfaces for every collection:

```bash
npx nextjs-studio --generate-types
```

This creates `.studio/types.d.ts` with a typed interface per collection and a `CollectionTypeMap` for use with `queryCollection()`.

## Default behavior (no config file)

Without `studio.config.ts`, the CMS:

- Scans `/contents` and auto-detects all collections
- Infers types from the file structure (MDX, JSON array, JSON object)
- Serves the editing UI on port `3030`
- Watches files via chokidar and pushes updates over WebSocket

## Next steps

- [Field Types](../reference/fields.md) — every available field type and its options
- [Collections](../collections/overview.md) — MDX, JSON, ordering, nested structure
- [Sync Scripts](../collections/import-scripts.md) — automate data sync from external sources
