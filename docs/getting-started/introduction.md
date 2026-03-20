# Introduction

Nextjs Studio is a Git-based, local-first CMS for Next.js projects. Content lives in your repository as plain files — no database, no backend, no sync service.

## How it works

The project has two independent parts that never interfere with each other.

### Core — build-time content engine

Runs during `next build`. It indexes your `/contents` directory, parses MDX and JSON files, validates content against your schema, and provides the `queryCollection()` API for fetching typed data in your pages.

Zero runtime dependencies. Everything resolves at build time.

### CLI server — local editing interface

A standalone server at `http://localhost:3030`. Reads and writes files directly on your filesystem, completely independent from Next.js.

| Editor | Used for |
|--------|----------|
| MDX Visual Editor | Rich text posts, articles, pages |
| JSON Sheet Editor | Spreadsheet view for JSON arrays |
| JSON Form Editor | Form view for JSON objects |

## Content structure

Folders inside `/contents` become collections automatically. No configuration needed.

```
contents/
├── blog/                        # MDX collection — one file per entry
│   ├── hello-world.mdx
│   ├── getting-started.mdx
│   └── media/                   # media assets scoped to this collection
│       └── cover.png
├── products/                    # JSON array → sheet view in the CMS
│   └── index.json
└── settings/                    # JSON object → form view in the CMS
    └── index.json
```

## Query API

Fetch content from your Next.js pages at build time. Import from `nextjs-studio/server` in server components — it auto-initializes the content store and the call is synchronous (no `async`/`await` needed):

```ts
import { queryCollection } from "nextjs-studio/server";

const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .limit(10)
  .all();
```

The package exposes two entry points:

| Entry point | Use in |
|-------------|--------|
| `nextjs-studio` | Client-safe types and pure utilities |
| `nextjs-studio/server` | Server components — auto-inits content store on import |

## Next steps

- [Installation](./installation.md) — set up the package and write your first query
- [Configuration](./configuration.md) — define schemas and import scripts
- [Collections](../collections/overview.md) — understand MDX, JSON array, and JSON object collections
