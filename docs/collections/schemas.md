# Schemas

Schemas define the shape of entries in a collection. They drive type generation, editor UI rendering, and validation.

## Defining a Schema

Schemas are defined in `studio.config.ts` under the `schemas` key:

```ts
// studio.config.ts
import type { CollectionSchema } from "nextjs-studio";

export default {
  schemas: [
    {
      collection: "blog",
      label: "Blog Posts",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "date", type: "date" },
        { name: "published", type: "boolean", defaultValue: false },
        { name: "category", type: "select", options: [
          { label: "Tech", value: "tech" },
          { label: "Design", value: "design" },
        ]},
        { name: "cover", type: "media", accept: ["image/*"] },
      ],
    },
  ],
};
```

## Field Types

| Type | Description | Extra Options |
|------|-------------|---------------|
| `text` | Single-line string | `placeholder`, `maxLength` |
| `long-text` | Multi-line textarea | `placeholder`, `rows` |
| `number` | Numeric value | `format`, `min`, `max`, `step` |
| `boolean` | Toggle | `defaultValue` |
| `date` | Date or datetime | `includeTime` |
| `select` | Single choice | `options[]` |
| `multi-select` | Multiple choices | `options[]` |
| `url` | URL string | `placeholder` |
| `email` | Email string | `placeholder` |
| `media` | File reference | `accept[]` |
| `object` | Nested fields | `fields[]` |
| `array` | List of items | `itemFields[]` |
| `id` | Auto-generated ID | `generate: "uuid" \| "nanoid" \| "cuid"` |
| `slug` | Auto-generated slug | `from` (source field) |
| `relation` | Reference to another collection | `collection`, `multiple` |
| `status` | Status with colors | `options[]` with `color` |
| `formula` | Computed value | `expression`, `resultType` |
| `created-time` | Auto timestamp | — |
| `updated-time` | Auto timestamp | — |

## Common Field Properties

Every field type supports these base properties:

```ts
interface BaseField {
  name: string;        // Machine-readable key
  label?: string;      // Human-readable label (defaults to name)
  required?: boolean;  // Whether the field must have a value
  description?: string; // Helper text shown in the editor
  defaultValue?: unknown;
}
```

## Nested Objects

Use `object` fields to define nested structures:

```ts
{
  name: "hero",
  type: "object",
  fields: [
    { name: "title", type: "text" },
    { name: "subtitle", type: "long-text" },
    { name: "image", type: "media" },
  ],
}
```

## Arrays

Use `array` fields for repeatable items:

```ts
{
  name: "tags",
  type: "array",
  itemFields: [
    { name: "label", type: "text" },
    { name: "color", type: "select", options: [...] },
  ],
}
```

## Type Generation

Run `npx nextjs-studio --generate-types` to generate TypeScript interfaces from your schemas. See [Type Generation](../reference/type-generation.md) for details.
