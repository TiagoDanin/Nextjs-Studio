# Collections

A collection is a folder inside `/contents`. The folder name becomes the collection name. The content type is inferred automatically from the files inside.

## Collection types

| Structure | Type | CMS view |
|-----------|------|----------|
| Folder with `.mdx` files | MDX collection | Rich text editor per file |
| `index.json` containing an array | JSON array | Spreadsheet / sheet view |
| `index.json` containing an object | JSON object | Form view |

### MDX collection

One file per entry. Frontmatter fields become `entry.data`. The Markdown body becomes `entry.body`.

```
contents/blog/
├── hello-world.mdx
└── getting-started.mdx
```

```mdx
---
title: Hello World
date: 2024-01-15
published: true
tags: [react, nextjs]
---

# Hello World

Body content here.
```

### JSON array collection

A single `index.json` containing an array. Each object in the array is one row in the sheet view.

```
contents/products/
└── index.json
```

```json
[
  { "name": "Widget A", "price": 29.99, "inStock": true  },
  { "name": "Widget B", "price": 48.99, "inStock": false }
]
```

### JSON object collection

A single `index.json` containing an object. Rendered as a form in the CMS. Useful for site settings, global config, or any singleton content.

```
contents/settings/
└── index.json
```

```json
{
  "siteName": "My Blog",
  "description": "A blog about things",
  "social": {
    "twitter": "@me",
    "github": "username"
  }
}
```

## Media assets

Each collection has its own `media/` subfolder for images, videos, and other files. Assets are committed to your repository alongside the content.

```
contents/blog/
├── hello-world.mdx
└── media/
    ├── cover.png
    └── demo.mp4
```

See [Media](./media.md) for upload options and supported file types.

## Ordering entries

By default, MDX entries are returned in filesystem order. To control the order, add a `collection.json` file to the folder with an array of slugs:

```json
["getting-started", "hello-world", "advanced-guide"]
```

The CMS respects this order in the sidebar and `queryCollection()` returns entries in the same order.

## Nested collections

Folders can be nested to create hierarchical structures:

```
contents/
└── docs/
    ├── guides/
    │   ├── getting-started.mdx
    │   └── advanced.mdx
    └── api/
        └── reference.mdx
```

`queryCollection("docs/guides")` queries only the `guides` subfolder.

Paths in `ContentEntry` reflect the nesting:

```ts
entry.collection // "docs/guides"
entry.slug       // "getting-started"
entry.path       // "docs/guides/getting-started"
```

## Next steps

- [Media](./media.md) — upload and manage media assets per collection
- [Import Scripts](./import-scripts.md) — automate data imports from external sources
- [Query API](../reference/query-api.md) — filter, sort, and paginate collection entries
- [Field Types](../reference/fields.md) — define schemas for typed content
