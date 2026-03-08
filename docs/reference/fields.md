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
    { name: "title",     type: "text",    required: true  },
    { name: "published", type: "boolean", defaultValue: false },
    { name: "date",      type: "date"                     },
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
| `name` | `string` | — | Key used in the data object |
| `label` | `string` | `name` | Human-readable label in the editor |
| `required` | `boolean` | `true` | Whether the field must have a value |
| `description` | `string` | — | Helper text shown below the input |
| `defaultValue` | — | — | Value used when creating a new entry |

---

## Scalar types

### `text`

Single-line string input.

```ts
{ name: "title", type: "text", maxLength: 120 }
```

| Option | Type | Description |
|--------|------|-------------|
| `maxLength` | `number` | Maximum character count |
| `placeholder` | `string` | Placeholder text |

---

### `long-text`

Multi-line textarea.

```ts
{ name: "excerpt", type: "long-text", rows: 3, required: false }
```

| Option | Type | Description |
|--------|------|-------------|
| `rows` | `number` | Minimum visible rows |
| `placeholder` | `string` | Placeholder text |

---

### `number`

Numeric input. Supports integers and decimals.

```ts
{ name: "price", type: "number", format: "decimal", min: 0 }
```

| Option | Type | Description |
|--------|------|-------------|
| `format` | `"integer" \| "decimal"` | Numeric format |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `step` | `number` | Step increment |

---

### `boolean`

Toggle or checkbox.

```ts
{ name: "published", type: "boolean", defaultValue: false }
```

---

### `date`

Date picker. Add `includeTime: true` for a datetime picker.

```ts
{ name: "date",        type: "date"                    }
{ name: "publishedAt", type: "date", includeTime: true }
```

| Option | Type | Description |
|--------|------|-------------|
| `includeTime` | `boolean` | Renders a datetime picker when `true` |

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
}
```

---

### `multi-select`

Dropdown that allows multiple selections.

```ts
{
  name: "tags",
  type: "multi-select",
  options: [
    { label: "TypeScript", value: "typescript" },
    { label: "React",      value: "react"      },
  ],
}
```

---

### `url`

Text input with URL validation.

```ts
{ name: "website", type: "url" }
```

---

### `email`

Text input with email validation.

```ts
{ name: "contact", type: "email" }
```

---

### `media`

Opens the media picker. Stores a file path relative to the collection's `media/` folder.

```ts
{ name: "cover", type: "media", accept: ["image/*"] }
```

| Option | Type | Description |
|--------|------|-------------|
| `accept` | `string[]` | MIME types or extensions to accept, e.g. `["image/*", ".pdf"]` |

---

## Structured types

### `object`

Nested group of fields, rendered as a sub-form.

```ts
{
  name: "seo",
  type: "object",
  fields: [
    { name: "metaTitle",       type: "text",      maxLength: 60        },
    { name: "metaDescription", type: "long-text", rows: 2, required: false },
    { name: "ogImage",         type: "media",     accept: ["image/*"], required: false },
  ],
}
```

---

### `array`

List of objects, rendered as a sheet (table) inside the form.

```ts
{
  name: "links",
  type: "array",
  itemFields: [
    { name: "label", type: "text" },
    { name: "url",   type: "url"  },
  ],
}
```

---

### `id`

Auto-generated unique identifier. Created once when the entry is first saved, never changed.

```ts
{ name: "id", type: "id", generate: "nanoid" }
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generate` | `"uuid" \| "nanoid" \| "cuid"` | `"nanoid"` | ID generation strategy |

---

### `slug`

URL-friendly slug, auto-generated from another field.

```ts
{ name: "slug", type: "slug", from: "title" }
```

| Option | Type | Description |
|--------|------|-------------|
| `from` | `string` | Field name used as the slug source |

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
  ],
  defaultValue: "draft",
}
```

Available colors: `"gray"` `"red"` `"yellow"` `"green"` `"blue"` `"purple"`

---

### `relation`

Reference to an entry in another collection.

```ts
{ name: "author",       type: "relation", collection: "authors"              }
{ name: "relatedPosts", type: "relation", collection: "blog",   multiple: true }
```

| Option | Type | Description |
|--------|------|-------------|
| `collection` | `string` | Target collection name |
| `multiple` | `boolean` | Allow selecting multiple entries |

---

### `created-time` / `updated-time`

System-managed timestamps. Set automatically — not editable by the user.

```ts
{ name: "createdAt", type: "created-time" }
{ name: "updatedAt", type: "updated-time" }
```

---

### `formula` *(v2)*

Computed field derived from an expression.

```ts
{ name: "total", type: "formula", expression: "price * quantity", resultType: "number" }
```

---

## Type inference

Use `InferSchemaData` to get a fully-typed interface for your schema:

```ts
import type { InferSchemaData } from "nextjs-studio";
import { blogSchema } from "./studio.config";

type BlogPost = InferSchemaData<typeof blogSchema>;
// {
//   title: string
//   published: boolean
//   date: ISODate
//   status: "draft" | "review" | "published"
//   author: string
//   createdAt: Date
// }
```

Or generate a `.d.ts` file for all collections at once:

```bash
npx nextjs-studio --generate-types
```

This writes `.studio/types.d.ts` with interfaces for every collection.

## Next steps

- [Configuration](../getting-started/configuration.md) — attach schemas to collections
- [Collections](../collections/overview.md) — MDX, JSON array, and JSON object collection types
- [Media](../collections/media.md) — manage media assets referenced by `media` fields
