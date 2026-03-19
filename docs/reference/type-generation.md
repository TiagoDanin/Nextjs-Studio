# Type Generation

Generate TypeScript interfaces from your collection schemas so `queryCollection()` returns fully typed results.

## Usage

```bash
npx nextjs-studio --generate-types
```

This creates `.studio/studio.d.ts` in your project root.

## Output

The generated file contains:

1. **Branded scalar types** — `Email`, `HttpUrl`, `ISODate`, `MediaPath`, `ID`, `Slug`
2. **Collection interfaces** — one per schema, e.g. `BlogEntry`
3. **Module augmentation** — maps collection names to their interfaces

```ts
// .studio/studio.d.ts (auto-generated)

export interface BlogEntry {
  title: string;
  date: ISODate;
  published: boolean;
  category: "tech" | "design";
  cover: MediaPath;
}

declare module 'nextjs-studio' {
  interface CollectionTypeMap {
    "blog": BlogEntry;
  }
}
```

## Typed Queries

After generation, `queryCollection()` infers the return type:

```ts
// result is BlogEntry[] — fully typed
const posts = queryCollection("blog")
  .where({ published: true })
  .all();

posts[0].title; // string ✓
posts[0].date;  // ISODate ✓
```

## Field Type Mapping

| Field Type | TypeScript Type |
|------------|----------------|
| `text`, `long-text` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| `date` | `ISODate` (or `Date` with `includeTime`) |
| `email` | `Email` |
| `url` | `HttpUrl` |
| `media` | `MediaPath` |
| `id` | `ID` |
| `slug` | `Slug` |
| `select`, `status` | Union of option values |
| `multi-select` | `Array<union>` |
| `object` | Inline object type |
| `array` | `Array<object type>` |
| `relation` | `ID` or `ID[]` |
| `formula` | Based on `resultType` |
| `created-time`, `updated-time` | `Date` |

## When to Regenerate

Run `--generate-types` after:

- Adding or removing collection schemas
- Changing field definitions in `studio.config.ts`
- Adding new collections to the contents directory
