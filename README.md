# Nextjs Studio

A Git-based, local-first CMS for Next.js projects.

Content lives in your repository as plain files. No database, no backend, no sync service. Editing happens through a standalone local server. Everything resolves at build time.

## Features

- **Content Collections** — folders inside `/contents` become collections automatically
- **MDX Editor** — rich text editing with TipTap, slash commands, drag & drop blocks, component insertion, and frontmatter binding
- **JSON Sheet Editor** — spreadsheet-style editing for JSON arrays with inline editing, sorting, and row management
- **JSON Form Editor** — auto-generated forms for JSON objects with nested field support
- **Schema Validation** — Zod-based validation with field-level type definitions
- **Media Library** — per-collection media folders, upload via drag & drop, paste, toolbar, or slash commands
- **Sync Scripts** — run data import and sync scripts directly from the CMS UI
- **File Watching** — live updates via chokidar and WebSocket

## Quick start

```bash
yarn add nextjs-studio
```

```bash
npx nextjs-studio
```

Open [http://localhost:3030](http://localhost:3030).

## Content structure

```
your-project/
├── contents/
│   ├── blog/
│   │   ├── hello-world.mdx    # MDX collection — one file per entry
│   │   └── media/             # media assets scoped to this collection
│   ├── products/
│   │   └── index.json         # JSON array → sheet view in the CMS
│   └── settings/
│       └── index.json         # JSON object → form view in the CMS
├── studio.config.ts            # optional — schemas and import scripts
└── next.config.js
```

## Query API

```ts
import { queryCollection } from "nextjs-studio";

// All published posts, newest first
const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .limit(10)
  .all();

// Single entry by slug
const post = queryCollection("blog")
  .where({ slug: "hello-world" })
  .first();
```

## Schema definition

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
          { name: "slug",      type: "slug",    from: "title"   },
          { name: "published", type: "boolean", defaultValue: false },
          { name: "date",      type: "date",    includeTime: true },
          { name: "cover",     type: "media",   accept: ["image/*"] },
          { name: "status",    type: "status",
            options: [
              { label: "Draft",     value: "draft",     color: "gray"  },
              { label: "Published", value: "published", color: "green" },
            ],
          },
        ],
      },
    },
  },
};

export default config;
```

## Requirements

- Node.js >= 22.10.0
- Next.js 16

## Documentation

**Getting Started**

- [Introduction](./docs/getting-started/introduction.md)
- [Installation](./docs/getting-started/installation.md)
- [Configuration](./docs/getting-started/configuration.md)

**Collections**

- [Overview](./docs/collections/overview.md)
- [Media](./docs/collections/media.md)
- [Import Scripts](./docs/collections/import-scripts.md)

**Reference**

- [Query API](./docs/reference/query-api.md)
- [Field Types](./docs/reference/fields.md)

**AI**

- [Using AI with Nextjs Studio](./docs/ai.md)

## License

[MIT](./LICENSE) — Tiago Danin
