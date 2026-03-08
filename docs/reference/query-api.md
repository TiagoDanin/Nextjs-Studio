# Query API

`queryCollection()` returns a fluent builder for fetching content from any collection. All queries run at build time — there is no runtime database.

```ts
import { queryCollection } from "nextjs-studio";

const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .limit(10)
  .all();
```

## Methods

### `.where(conditions)`

Filter entries by field value. All conditions must match (AND logic).

```ts
// Simple match
queryCollection("blog").where({ published: true }).all();

// Multiple conditions
queryCollection("blog").where({ published: true, category: "tech" }).all();
```

Supports dot notation for nested fields:

```ts
queryCollection("pages").where({ "hero.title": "Welcome" }).all();
```

---

### `.sort(field, order?)`

Sort by a field. `order` defaults to `"asc"`.

```ts
queryCollection("blog").sort("date", "desc").all();
queryCollection("products").sort("price", "asc").all();
```

| Parameter | Type | Default |
|-----------|------|---------|
| `field` | `string` | — |
| `order` | `"asc" \| "desc"` | `"asc"` |

---

### `.limit(count)`

Return at most `count` entries.

```ts
queryCollection("blog").limit(5).all();
```

---

### `.offset(count)`

Skip the first `count` entries. Use with `.limit()` for pagination.

```ts
// Page 2 with 10 entries per page
queryCollection("blog")
  .sort("date", "desc")
  .offset(10)
  .limit(10)
  .all();
```

---

### `.all()`

Execute the query. Returns `ContentEntry[]`.

---

### `.first()`

Return the first match, or `undefined` if none.

```ts
const post = queryCollection("blog")
  .where({ slug: "hello-world" })
  .first();
```

---

### `.count()`

Return the total number of matching entries.

```ts
const total = queryCollection("blog").where({ published: true }).count();
```

## ContentEntry shape

Every method returns or works with `ContentEntry` objects:

```ts
interface ContentEntry {
  collection: string;            // collection name, e.g. "blog"
  slug: string;                  // filename without extension, e.g. "hello-world"
  path: string;                  // full relative path, e.g. "blog/hello-world"
  body?: string;                 // MDX body (undefined for JSON collections)
  data: Record<string, unknown>; // frontmatter or JSON data
}
```

## Examples

### All published posts, newest first

```ts
const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .all();
```

### Single post by slug

```ts
const post = queryCollection("blog")
  .where({ slug: params.slug })
  .first();

if (!post) notFound();
```

### Paginated posts

```ts
const PAGE_SIZE = 10;

function getPosts(page: number) {
  return queryCollection("blog")
    .where({ published: true })
    .sort("date", "desc")
    .offset((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .all();
}
```

### Count total entries

```ts
const publishedCount = queryCollection("blog")
  .where({ published: true })
  .count();
```

## Next steps

- [Collections](../collections/overview.md) — understand how collections are structured
- [Field Types](./fields.md) — define schemas for typed `data` properties
- [Configuration](../getting-started/configuration.md) — generate TypeScript types for your collections
