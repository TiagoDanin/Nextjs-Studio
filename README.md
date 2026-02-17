# Nextjs Studio

A Git-based, local-first CMS for **Next.js** projects.

`nextjs-studio` provides structured content management from a `/contents` directory and a standalone CLI-powered editing interface completely independent from the Next.js runtime. All content is resolved at build time. Editing happens through a local CMS server. Works with any Next.js setup.

## Features

- **Content Collections** — Folders inside `/contents` become collections automatically
- **MDX Editor** — Rich text editing with TipTap, slash commands, drag & drop blocks, and component insertion
- **JSON Sheet Editor** — Spreadsheet-style editing for JSON arrays (add/delete rows, sort, inline editing)
- **Query API** — Chainable builder for fetching content at build time
- **Schema Validation** — Zod-based content validation
- **Media Library** — Built-in media picker for images and files
- **Script Runner** — Execute import/sync scripts from the CMS UI
- **File Watching** — Live updates via chokidar and WebSocket

## Quick Start

```bash
# Install
yarn add nextjs-studio

# Start the CMS
npx nextjs-studio
```

The CMS Admin opens at [http://localhost:3030](http://localhost:3030).

## Content Structure

```
your-project/
├── contents/
│   ├── blog/
│   │   ├── post-1.mdx        # MDX content entry
│   │   └── post-2.mdx
│   ├── products/
│   │   └── index.json         # JSON array → sheet view
│   └── settings/
│       └── index.json         # JSON object → form view
├── studio.config.ts
└── next.config.js
```

## Query API

```ts
import { queryCollection } from "nextjs-studio";

// Get all published blog posts
const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .limit(10)
  .all();

// Get a single entry
const post = queryCollection("blog")
  .where({ slug: "hello-world" })
  .first();
```

## Documentation

See the [Getting Started Guide](./docs/getting-started/introduction.md) for full documentation.

- [Introduction](./docs/getting-started/introduction.md)
- [Installation](./docs/getting-started/installation.md)
- [Configuration](./docs/getting-started/configuration.md)

## License

[MIT](./LICENSE) - Tiago Danin
