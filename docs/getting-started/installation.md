# Installation

## Requirements

- **Node.js** >= 22.10.0
- **Next.js 16**

## Install the Package

```bash
yarn add nextjs-studio
```

## Project Setup

### 1. Create the Contents Directory

Create a `/contents` directory at the root of your project. Each subfolder becomes a collection:

```bash
mkdir -p contents/blog
```

### 3. Add Your First Content

Create an MDX file in your collection:

```mdx
---
title: My First Post
date: 2026-01-01
published: true
---

# My First Post

Welcome to nextjs-studio!
```

Save this as `contents/blog/my-first-post.mdx`.

### 4. Query Content in Your Pages

Use the `queryCollection` API in your Next.js pages:

```tsx
import { queryCollection } from "nextjs-studio";

export default function BlogPage() {
  const posts = queryCollection("blog")
    .where({ published: true })
    .sort("date", "desc")
    .all();

  return (
    <div>
      <h1>Blog</h1>
      {posts.map((post) => (
        <article key={post.slug}>
          <h2>{post.data.title}</h2>
          <p>{post.path}</p>
        </article>
      ))}
    </div>
  );
}
```

### 5. Start the CMS

Run the CLI server to open the editing interface:

```bash
npx nextjs-studio
```

The CMS will be available at [http://localhost:3030](http://localhost:3030).

## Verify Installation

After setup, your project structure should look like:

```
your-project/
├── contents/
│   └── blog/
│       └── my-first-post.mdx
├── next.config.js
├── package.json
└── studio.config.ts          # optional
```

Run `npx nextjs-studio` and verify the CMS loads in your browser with the blog collection visible in the sidebar.

## Next Steps

- [Configuration](./configuration.md) — Set up `studio.config.ts` for advanced features
