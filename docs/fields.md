# Field Types

Fields define the shape of your content. You declare them in `studio.config.ts` as part of a collection schema. The CMS uses this definition to render the correct editor input for each field, and the `queryCollection()` API returns fully-typed data based on your schema.

## Defining a Schema

Add a `schema` to any collection in your `studio.config.ts`:

```ts
import type { StudioConfig, CollectionSchema } from "nextjs-studio";

const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "title",     type: "text",    required: true },
    { name: "published", type: "boolean"                 },
    { name: "date",      type: "date"                    },
  ],
};

const config: StudioConfig = {
  collections: {
    blog: { schema: blogSchema },
  },
};

export default config;
```

## Core Types

### `text`

A single-line string input.

```ts
{ name: "title", type: "text", maxLength: 120 }
```

| Option | Type | Description |
|---|---|---|
| `maxLength` | `number` | Maximum character limit |
| `placeholder` | `string` | Placeholder text |

---

### `long-text`

A multiline textarea input.

```ts
{ name: "excerpt", type: "long-text", rows: 4 }
```

| Option | Type | Description |
|---|---|---|
| `rows` | `number` | Minimum visible rows |
| `placeholder` | `string` | Placeholder text |

---

### `number`

A numeric input. Supports integers and decimals.

```ts
{ name: "views", type: "number", format: "integer", min: 0 }
```

| Option | Type | Description |
|---|---|---|
| `format` | `"integer" \| "decimal"` | Numeric format |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `step` | `number` | Step increment |

---

### `boolean`

A toggle or checkbox input.

```ts
{ name: "published", type: "boolean", defaultValue: false }
```

---

### `date`

A date picker. Set `includeTime: true` to render a datetime picker instead.

```ts
{ name: "date",        type: "date" }
{ name: "publishedAt", type: "date", includeTime: true }
```

| Option | Type | Description |
|---|---|---|
| `includeTime` | `boolean` | Renders a datetime picker when `true` |

---

### `select`

A dropdown with a single selectable option.

```ts
{
  name: "category",
  type: "select",
  options: [
    { label: "Technology", value: "tech" },
    { label: "Design",     value: "design" },
  ],
}
```

---

### `multi-select`

A dropdown that allows selecting multiple options.

```ts
{
  name: "tags",
  type: "multi-select",
  options: [
    { label: "TypeScript", value: "typescript" },
    { label: "React",      value: "react" },
  ],
}
```

---

### `url`

A text input with URL validation.

```ts
{ name: "website", type: "url" }
```

---

### `email`

A text input with email validation.

```ts
{ name: "contact", type: "email" }
```

---

### `media`

Opens the media library picker. Stores a file path or URL.

```ts
{ name: "cover", type: "media", accept: ["image/*"] }
```

| Option | Type | Description |
|---|---|---|
| `accept` | `string[]` | Accepted MIME types or extensions (e.g. `["image/*", ".pdf"]`) |

---

## Structured Types

### `object`

A nested group of fields, rendered as a sub-form.

```ts
{
  name: "seo",
  type: "object",
  fields: [
    { name: "metaTitle",       type: "text",      maxLength: 60 },
    { name: "metaDescription", type: "long-text", required: false },
    { name: "ogImage",         type: "media",     accept: ["image/*"], required: false },
  ],
}
```

---

### `array`

A list of objects, rendered as an editable table (sheet view).

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

An auto-generated unique identifier. Created once when the entry is first saved.

```ts
{ name: "id", type: "id", generate: "nanoid" }
```

| Option | Type | Description |
|---|---|---|
| `generate` | `"uuid" \| "nanoid" \| "cuid"` | ID generation strategy. Defaults to `"nanoid"` |

---

### `slug`

A URL-friendly slug auto-generated from another field.

```ts
{ name: "slug", type: "slug", from: "title" }
```

| Option | Type | Description |
|---|---|---|
| `from` | `string` | The field name used as the slug source |

---

## Other Types

### `status`

An enhanced select with semantic color labels. Useful for workflow states.

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

Available colors: `"gray"`, `"red"`, `"yellow"`, `"green"`, `"blue"`, `"purple"`.

---

### `relation`

A reference to an entry in another collection.

```ts
{ name: "author",   type: "relation", collection: "authors"              }
{ name: "relatedPosts", type: "relation", collection: "blog", multiple: true }
```

| Option | Type | Description |
|---|---|---|
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

### `formula`

A computed field whose value is derived from an expression. *(v2)*

```ts
{ name: "total", type: "formula", expression: "price * quantity", resultType: "number" }
```

---

## Type Inference

When you pass a schema to `queryCollection()`, the returned data is fully typed. Use `InferSchemaData` to extract the type:

```ts
import type { InferSchemaData } from "nextjs-studio";
import { blogSchema } from "./studio.config";

type BlogPost = InferSchemaData<typeof blogSchema>;
// {
//   title: string
//   published: boolean
//   date: ISODate
//   category: "tech" | "design"
//   tags: Array<"typescript" | "react">
//   cover: MediaPath
//   contact: Email
//   publishedAt: Date
//   createdAt: Date
// }
```

## Generating Types

Run the following command to generate a `.d.ts` file with interfaces for all your collections:

```bash
npx nextjs-studio --generate-types
```

This creates `.studio/types.d.ts` with a typed interface per collection and a `CollectionTypeMap` for use with `queryCollection()`.

## Common Options

These options are available on every field type:

| Option | Type | Description |
|---|---|---|
| `name` | `string` | Key used in the data object |
| `label` | `string` | Human-readable label shown in the editor |
| `required` | `boolean` | Whether the field must have a value. Defaults to `true` |
| `description` | `string` | Helper text shown below the input |
| `defaultValue` | — | Default value used when creating a new entry |
