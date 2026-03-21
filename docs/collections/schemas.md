# Schemas

Schemas define the shape of entries in a collection. They drive the editor UI, default values, type generation, and validation.

## Defining a schema

Create a `CollectionSchema` object and attach it to a collection in `studio.config.ts`:

```ts
// studio.config.ts
import type { StudioConfig, CollectionSchema } from "nextjs-studio";

const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "title",     type: "text",    required: true          },
    { name: "published", type: "boolean", defaultValue: false     },
    { name: "date",      type: "date"                             },
    { name: "status",    type: "status",  options: [
      { label: "Draft",     value: "draft",     color: "gray"  },
      { label: "Published", value: "published", color: "green" },
    ], defaultValue: "draft" },
  ],
};

const config: StudioConfig = {
  collections: {
    blog: {
      schema: blogSchema,
    },
  },
};

export default config;
```

It's a good practice to keep schemas in separate files under `schemas/`:

```
schemas/
├── blog.ts
├── authors.ts
└── products.ts
```

```ts
// studio.config.ts
import { blogSchema }    from "./schemas/blog";
import { authorsSchema } from "./schemas/authors";

export default {
  collections: {
    blog:    { schema: blogSchema    },
    authors: { schema: authorsSchema },
  },
} satisfies StudioConfig;
```

---

## Schema options

| Option | Type | Description |
|--------|------|-------------|
| `collection` | `string` | Collection name (matches the folder name under `contents/`) |
| `label` | `string` | Display name shown in the CMS sidebar |
| `fields` | `FieldDefinition[]` | Field definitions — see [Field Types](../reference/fields.md) |

---

## Collection options

Set per-collection configuration alongside the schema:

```ts
// studio.config.ts
collections: {
  blog: {
    schema: blogSchema,
    mediaDir: "contents/blog/media",  // where media files are stored
    scripts: {
      sync: "node scripts/sync-posts.js",  // script shown in the CMS toolbar
    },
  },
},
```

| Option | Type | Description |
|--------|------|-------------|
| `schema` | `CollectionSchema` | Field definitions and collection metadata |
| `mediaDir` | `string` | Path to the media folder for this collection (relative to project root) |
| `scripts.sync` | `string` | Shell command to run from the CMS toolbar (e.g. sync from an external source) |

---

## Field types

| Type | Description | Extra Options |
|------|-------------|---------------|
| `text` | Single-line string | `placeholder`, `maxLength` |
| `long-text` | Multi-line textarea | `placeholder`, `rows` |
| `number` | Numeric value | `format`, `min`, `max`, `step` |
| `boolean` | Toggle switch | — |
| `date` | Date, datetime, month/year, or year picker | `includeTime`, `includeDay`, `includeMonth` |
| `email` | Email address with validation | `placeholder` |
| `url` | URL with validation | `placeholder` |
| `select` | Single-choice dropdown | `options[]` |
| `multi-select` | Multi-choice checkboxes | `options[]` |
| `media` | File picker | `accept[]` |
| `object` | Nested group of fields | `fields[]` |
| `array` | Repeatable list of items | `itemFields[]` |
| `id` | Auto-generated unique ID | `generate` |
| `slug` | Auto-slugified field | `from` |
| `relation` | Reference to another collection | `collection`, `multiple` |
| `status` | Workflow status with color labels | `options[]` with `color` |
| `formula` | Read-only computed field | `expression`, `resultType` |
| `created-time` | Auto-managed creation timestamp | — |
| `updated-time` | Auto-managed update timestamp | — |

Full documentation for every type is in [Field Types](../reference/fields.md).

---

## Common field properties

Every field type supports these base properties:

```ts
interface BaseField {
  name: string;           // Machine-readable key (used in the file and data object)
  label?: string;         // Human-readable label (defaults to name)
  required?: boolean;     // Default: true
  description?: string;   // Helper text shown in the editor
  defaultValue?: unknown; // Used for new entries and missing fields
}
```

---

## Default values

Set `defaultValue` to pre-fill a field when creating a new entry, or when an existing file is missing the field:

```ts
{ name: "published", type: "boolean",      defaultValue: false       }
{ name: "status",    type: "status",       defaultValue: "draft"     }
{ name: "tags",      type: "multi-select", defaultValue: ["react"]   }
```

The CMS always renders schema fields even when they are absent from the file. Missing fields appear with their `defaultValue` (or an empty state), and are written to the file on save.

---

## Nested objects

Use `object` fields to define nested structures. The editor renders them as an inline sub-form with a left border:

```ts
{
  name: "seo",
  type: "object",
  label: "SEO",
  fields: [
    { name: "metaTitle",       type: "text",      maxLength: 60       },
    { name: "metaDescription", type: "long-text", rows: 2             },
    { name: "ogImage",         type: "media",     accept: ["image/*"] },
  ],
}
```

Stored in MDX frontmatter:

```yaml
seo:
  metaTitle: My Page Title
  metaDescription: A short description for search engines.
  ogImage: /media/og.png
```

---

## Arrays

Use `array` fields for repeatable items. Each item is an object with its own fields. The editor renders each item inline with add/remove buttons:

```ts
{
  name: "links",
  type: "array",
  label: "Links",
  itemFields: [
    { name: "label", type: "text"                           },
    { name: "url",   type: "url",  placeholder: "https://…" },
    { name: "type",  type: "select", options: [
      { label: "External", value: "external" },
      { label: "Internal", value: "internal" },
    ]},
  ],
}
```

For simple string arrays, use `itemFields: []` or a single `text` item field. The editor renders a comma-separated input in that case:

```ts
{ name: "keywords", type: "array", itemFields: [] }
```

---

## Example: full schema

A complete schema covering all common field types:

```ts
// schemas/blog.ts
import type { CollectionSchema } from "nextjs-studio";

export const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "id",          type: "id",           generate: "nanoid"                            },
    { name: "slug",        type: "slug",          from: "title"                                 },
    { name: "title",       type: "text",          required: true,  maxLength: 120               },
    { name: "excerpt",     type: "long-text",     rows: 3,         required: false              },
    { name: "publishedAt", type: "date",          includeTime: true                             },
    { name: "status",      type: "status",        defaultValue: "draft",  options: [
      { label: "Draft",     value: "draft",     color: "gray"  },
      { label: "Published", value: "published", color: "green" },
    ]},
    { name: "author",      type: "relation",      collection: "authors"                         },
    { name: "cover",       type: "media",         accept: ["image/*"]                           },
    { name: "tags",        type: "multi-select",  options: [
      { label: "TypeScript", value: "typescript" },
      { label: "React",      value: "react"      },
    ]},
    { name: "seo", type: "object", fields: [
      { name: "metaTitle",       type: "text",      maxLength: 60   },
      { name: "metaDescription", type: "long-text", rows: 2         },
    ]},
    { name: "createdAt",   type: "created-time"                                                 },
    { name: "updatedAt",   type: "updated-time"                                                 },
  ],
};
```

---

## Type generation

Run `npx nextjs-studio --generate-types` to generate TypeScript interfaces from your schemas:

```bash
npx nextjs-studio --generate-types
```

This writes `.studio/types.d.ts` with an interface for every collection. You can also use `InferSchemaData` directly:

```ts
import type { InferSchemaData } from "nextjs-studio";
import { blogSchema } from "./schemas/blog";

type BlogPost = InferSchemaData<typeof blogSchema>;
```

See [Type Generation](../reference/type-generation.md) for details.

---

## Next steps

- [Field Types](../reference/fields.md) — every field type and its options
- [MDX Collections](./mdx-collections.md) — schema in frontmatter-based content
- [JSON Collections](./json-collections.md) — schema in JSON array or object collections
- [Media](./media.md) — configure `mediaDir` and upload assets
