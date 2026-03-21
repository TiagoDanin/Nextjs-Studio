# Field Types

Fields define the shape of your content. Declare them in a `CollectionSchema` inside `studio.config.ts`. The CMS renders the correct editor input for each type, and `queryCollection()` returns fully-typed data when you use `InferSchemaData`.

## Defining a schema

```ts
// studio.config.ts
import type { StudioConfig, CollectionSchema } from "nextjs-studio";

const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "title",     type: "text",    required: true         },
    { name: "published", type: "boolean", defaultValue: false    },
    { name: "date",      type: "date"                            },
  ],
};

const config: StudioConfig = {
  collections: {
    blog: { schema: blogSchema },
  },
};

export default config;
```

## Common options

Every field type accepts these base options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | — | Key used in the data object and file |
| `label` | `string` | derived from `name` | Human-readable label in the editor |
| `required` | `boolean` | `true` | Whether the field must have a value |
| `description` | `string` | — | Helper text shown below the input |
| `defaultValue` | — | — | Value used when creating a new entry or when the field is missing |

---

## Scalar types

### `text`

Single-line string input.

```ts
{ name: "title", type: "text", maxLength: 120, placeholder: "Enter title…" }
```

| Option | Type | Description |
|--------|------|-------------|
| `maxLength` | `number` | Maximum character count |
| `placeholder` | `string` | Placeholder text shown in the input |

---

### `long-text`

Multi-line textarea.

```ts
{ name: "excerpt", type: "long-text", rows: 4, placeholder: "Short description…" }
```

| Option | Type | Description |
|--------|------|-------------|
| `rows` | `number` | Minimum visible rows (default `3`) |
| `placeholder` | `string` | Placeholder text |

---

### `number`

Numeric input. Supports integers and decimals.

```ts
{ name: "price",    type: "number", format: "decimal", min: 0, max: 100, step: 0.01 }
{ name: "quantity", type: "number", format: "integer", min: 0, max: 9999            }
```

| Option | Type | Description |
|--------|------|-------------|
| `format` | `"integer" \| "decimal"` | Controls display and validation |
| `min` | `number` | Minimum allowed value |
| `max` | `number` | Maximum allowed value |
| `step` | `number` | Step increment for the spinner |

---

### `boolean`

Toggle switch.

```ts
{ name: "published", type: "boolean", defaultValue: false }
```

---

### `date`

Date picker. Use `includeTime`, `includeDay`, and `includeMonth` to control the level of precision.

```ts
{ name: "date",       type: "date"                                        } // date picker
{ name: "publishedAt", type: "date", includeTime: true                   } // datetime picker
{ name: "monthYear",  type: "date", includeDay: false                    } // month/year picker
{ name: "yearOnly",   type: "date", includeDay: false, includeMonth: false } // year-only input
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeTime` | `boolean` | `false` | Adds time selection — renders a datetime-local picker |
| `includeDay` | `boolean` | `true` | Set to `false` to show only month and year |
| `includeMonth` | `boolean` | `true` | Set to `false` (along with `includeDay: false`) to show only the year |

Stored values:
- Full date → `"2024-01-20"`
- With time → `"2024-01-20T10:00"`
- Month/year → `"2024-01"`
- Year only → `"2024"`

---

### `email`

Text input validated as an email address. The editor blocks saving if the value is not a valid email.

```ts
{ name: "contact", type: "email", placeholder: "user@example.com" }
```

| Option | Type | Description |
|--------|------|-------------|
| `placeholder` | `string` | Placeholder text |

---

### `url`

Text input validated as a URL. The editor blocks saving if the value is not a valid URL.

```ts
{ name: "website", type: "url", placeholder: "https://example.com" }
```

| Option | Type | Description |
|--------|------|-------------|
| `placeholder` | `string` | Placeholder text |

---

### `select`

Dropdown with a single selectable option.

```ts
{
  name: "category",
  type: "select",
  options: [
    { label: "Technology", value: "tech"   },
    { label: "Design",     value: "design" },
  ],
  defaultValue: "tech",
}
```

| Option | Type | Description |
|--------|------|-------------|
| `options` | `{ label: string; value: string }[]` | Available choices |

---

### `multi-select`

Checkbox group that allows multiple selections.

```ts
{
  name: "tags",
  type: "multi-select",
  options: [
    { label: "TypeScript", value: "typescript" },
    { label: "React",      value: "react"      },
    { label: "Next.js",    value: "nextjs"     },
  ],
  defaultValue: ["react"],
}
```

Stored as a YAML/JSON array: `["react", "typescript"]`

| Option | Type | Description |
|--------|------|-------------|
| `options` | `{ label: string; value: string }[]` | Available choices |

---

## Media

### `media`

Opens the media picker. Stores the URL path to the selected file (e.g. `/api/media/blog/cover.png`). Shows an image preview when the selected file is an image.

```ts
{ name: "cover",      type: "media", accept: ["image/*"]                         }
{ name: "attachment", type: "media", accept: ["image/*", "application/pdf", "video/*"] }
```

| Option | Type | Description |
|--------|------|-------------|
| `accept` | `string[]` | MIME types or glob patterns to filter the picker (e.g. `["image/*", ".pdf"]`) |

Media assets are stored in the collection's `mediaDir`. Configure it in `studio.config.ts`:

```ts
// studio.config.ts
collections: {
  blog: {
    schema: blogSchema,
    mediaDir: "contents/blog/media",
  },
},
```

---

## Structured types

### `object`

Nested group of fields, rendered as an inline sub-form.

```ts
{
  name: "seo",
  type: "object",
  label: "SEO",
  fields: [
    { name: "metaTitle",       type: "text",      maxLength: 60                   },
    { name: "metaDescription", type: "long-text", rows: 2                         },
    { name: "ogImage",         type: "media",     accept: ["image/*"]             },
  ],
}
```

Stored as a nested YAML object:

```yaml
seo:
  metaTitle: My Page Title
  metaDescription: A short description.
  ogImage: /media/og.png
```

---

### `array`

Ordered list of items. Each item is an object with its own fields, rendered inline with add/remove controls.

```ts
{
  name: "links",
  type: "array",
  label: "Links",
  itemFields: [
    { name: "label", type: "text" },
    { name: "url",   type: "url",    placeholder: "https://…" },
    { name: "type",  type: "select", options: [
      { label: "External", value: "external" },
      { label: "Internal", value: "internal" },
    ]},
  ],
}
```

For simple string arrays, use a single `text` item field (or an empty `itemFields: []`). The editor renders a comma-separated input in that case.

Stored as a YAML array:

```yaml
links:
  - label: GitHub
    url: https://github.com
    type: external
```

| Option | Type | Description |
|--------|------|-------------|
| `itemFields` | `FieldDefinition[]` | Fields for each item in the list |

---

## Identity types

### `id`

Auto-generated unique identifier. Read-only. Generated once when the entry is first saved, then never changed.

```ts
{ name: "id", type: "id", generate: "nanoid" }
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generate` | `"uuid" \| "nanoid" \| "cuid"` | `"nanoid"` | ID generation strategy |

---

### `slug`

URL-friendly slug. Automatically generated from another field when the slug is empty. You can also type a custom slug — it is slugified on blur.

```ts
{ name: "slug", type: "slug", from: "title" }
```

| Option | Type | Description |
|--------|------|-------------|
| `from` | `string` | Field name used as the slug source when the slug is empty |

---

## Advanced types

### `status`

Select with semantic color labels. Designed for workflow states.

```ts
{
  name: "status",
  type: "status",
  options: [
    { label: "Draft",     value: "draft",     color: "gray"   },
    { label: "In Review", value: "review",    color: "yellow" },
    { label: "Published", value: "published", color: "green"  },
    { label: "Archived",  value: "archived",  color: "red"    },
  ],
  defaultValue: "draft",
}
```

Available colors: `"gray"` `"red"` `"yellow"` `"green"` `"blue"` `"purple"`

---

### `relation`

Reference to an entry in another collection. Stores the slug of the referenced entry.

```ts
{ name: "author",       type: "relation", collection: "authors"               }
{ name: "relatedPosts", type: "relation", collection: "blog",  multiple: true }
```

| Option | Type | Description |
|--------|------|-------------|
| `collection` | `string` | Target collection name |
| `multiple` | `boolean` | Allow selecting multiple entries |

---

### `formula`

Computed read-only field. Evaluated from an expression using the current entry's data as local variables.

```ts
{ name: "fullName", type: "formula", expression: "firstName + ' ' + lastName",   resultType: "string" }
{ name: "total",    type: "formula", expression: "price * quantity",              resultType: "number" }
{ name: "summary",  type: "formula", expression: "title + ' — ' + status",       resultType: "string" }
```

The expression runs client-side using `new Function`. Any field name in the schema can be referenced directly.

| Option | Type | Description |
|--------|------|-------------|
| `expression` | `string` | JavaScript expression using field names as variables |
| `resultType` | `"string" \| "number"` | Expected output type |

---

### `created-time` / `updated-time`

System-managed timestamps. Set automatically by the CMS — not editable by the user. Displayed as a formatted date in the editor (e.g. `Jan 20, 2024, 10:00 AM`).

```ts
{ name: "createdAt", type: "created-time" }
{ name: "updatedAt", type: "updated-time" }
```

Stored as ISO 8601 strings in the file.

---

## Type inference

Use `InferSchemaData` to get a fully-typed interface from your schema:

```ts
import type { InferSchemaData } from "nextjs-studio";
import { blogSchema } from "./schemas/blog";

type BlogPost = InferSchemaData<typeof blogSchema>;
// {
//   id: string
//   slug: string
//   title: string
//   status: "draft" | "review" | "published" | "archived"
//   author: string
//   createdAt: string
//   updatedAt: string
//   seo: { metaTitle: string; metaDescription: string; ogImage: string }
//   links: Array<{ label: string; url: string; type: string }>
// }
```

Or generate a `.d.ts` file for all collections at once:

```bash
npx nextjs-studio --generate-types
```

This writes `.studio/types.d.ts` with interfaces for every collection.

---

## Field type reference

| Type | Editor input | Stored as | Notes |
|------|-------------|-----------|-------|
| `text` | Single-line input | `string` | |
| `long-text` | Textarea | `string` | |
| `number` | Number input | `number` | |
| `boolean` | Toggle switch | `boolean` | |
| `date` | Date/datetime/month/year picker | `string` | Format depends on options |
| `email` | Email input | `string` | Validated on save |
| `url` | URL input | `string` | Validated on save |
| `select` | Dropdown | `string` | |
| `multi-select` | Checkbox group | `string[]` | |
| `media` | Path input + picker | `string` | URL path to file |
| `object` | Inline sub-form | `object` | |
| `array` | Inline item list | `array` | |
| `id` | Read-only | `string` | Auto-generated once |
| `slug` | Text input | `string` | Slugified on blur |
| `relation` | Text input | `string` | Slug of referenced entry |
| `status` | Dropdown | `string` | Colored labels |
| `formula` | Read-only | — | Not stored; computed at view time |
| `created-time` | Read-only | `string` | ISO 8601 |
| `updated-time` | Read-only | `string` | ISO 8601 |

## Next steps

- [Configuration](../getting-started/configuration.md) — attach schemas to collections
- [Schemas](../collections/schemas.md) — full schema configuration reference
- [Media](../collections/media.md) — manage media assets referenced by `media` fields
