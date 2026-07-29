# Installation

## Requirements

- **Node.js** >= 22.10.0
- **Next.js** 16

## Install

```bash
yarn add nextjs-studio
```

## Setup

### 1. Create the contents directory

```bash
mkdir -p contents/blog
```

Each subfolder becomes a collection. No config needed.

### 2. Add your first entry

Create `contents/blog/hello-world.mdx`:

```mdx
---
title: Hello World
date: 2024-01-15
published: true
---

# Hello World

Your first post.
```

### 3. Query content in your pages

```tsx
// app/blog/page.tsx
import { queryCollection } from "nextjs-studio/server";

export default function BlogPage() {
  const posts = queryCollection("blog")
    .where({ published: true })
    .sort("date", "desc")
    .all();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>{post.title as string}</li>
      ))}
    </ul>
  );
}
```

Note: no `async`, no `await` — `queryCollection` is synchronous. Import from `nextjs-studio/server` in server components; it auto-initializes the content store on import.

### 4. Wrap your Next.js config

```ts
// next.config.ts
import { withStudio } from "nextjs-studio/next";

export default withStudio({
  // your existing config
});
```

Without this, editing a file in `contents/` does not refresh the browser during `next dev`: content is read through `fs`, so it never enters the module graph and Next has nothing to detect. See [Hot Reload](../reference/hot-reload.md).

### 5. Start the CMS

```bash
npx nextjs-studio
```

Open [http://localhost:3030](http://localhost:3030). Your `blog` collection appears in the sidebar.

## Project structure after setup

```
your-project/
├── contents/
│   └── blog/
│       └── hello-world.mdx
├── next.config.js
├── package.json
└── studio.config.ts      # optional — add for schemas and scripts
```

## Next steps

- [Configuration](./configuration.md) — define schemas and import scripts
- [Collections](../collections/overview.md) — MDX, JSON array, and JSON object collections
- [Query API](../reference/query-api.md) — filtering, sorting, pagination
- [Hot Reload](../reference/hot-reload.md) — why `withStudio()` is needed and what it does
