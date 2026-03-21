# Query API

`queryCollection()` returns a fluent builder for fetching content from any collection. All queries run at build time — there is no runtime database.

## Entry Points

The package exposes two entry points:

| Entry point | Usage | Includes `fs` |
|-------------|-------|---------------|
| `nextjs-studio` | Client components, types, pure utilities | No |
| `nextjs-studio/server` | Server components — auto-inits content store on import | Yes |

```ts
// Server components — auto-initializes the content store
import { queryCollection } from "nextjs-studio/server";

const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .limit(10)
  .all();
```

::callout{type="warning"}
Use `nextjs-studio/server` in server components. The base `nextjs-studio` import does not auto-initialize the content store and will throw if called without prior setup.
::

---

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

### `.excludeDrafts()`

Exclude entries that have `draft: true` in their data.

```ts
queryCollection("blog").excludeDrafts().all();
```

---

### `.locale(code)`

Filter entries by locale code (parsed from filename, e.g. `post.pt.mdx` → `"pt"`).

```ts
queryCollection("blog").locale("pt").all();
```

---

### `.all()`

Execute the query. Returns `EntryResult<T>[]` — each entry includes frontmatter data merged with entry metadata (`body`, `locale`, `collection`, `slug`, `path`).

```ts
const posts = queryCollection("blog").all();
// posts[0].title  — from frontmatter
// posts[0].body   — raw MDX content
// posts[0].locale — locale from filename
```

---

### `.first()`

Return the first match, or `undefined` if none.

```ts
const post = queryCollection("blog")
  .where({ slug: "hello-world" })
  .first();
```

---

### `.one()`

Return the single entry from the collection. Throws if the collection is empty. Use for singleton collections (JSON objects like `about`, `settings`).

```ts
// No need for ! or undefined checks
const about = queryCollection("about").one();
```

---

### `.count()`

Return the total number of matching entries.

```ts
const total = queryCollection("blog").where({ published: true }).count();
```

## Return Shape (`EntryResult<T>`)

Every query method returns `EntryResult<T>` — a flat object that merges entry metadata with frontmatter/JSON data. No need to use `fs` or `gray-matter` to access the body or metadata.

```ts
type EntryResult<T> = T & {
  body?: string;      // raw MDX body (undefined for JSON entries)
  locale?: string;    // parsed from filename (e.g. "pt" from "post.pt.mdx")
  collection: string; // collection name, e.g. "blog"
  slug: string;       // derived from filename
  path: string;       // e.g. "/blog/hello-world"
};
```

Entry-level fields (`collection`, `slug`, `path`) serve as defaults — if frontmatter defines the same key (e.g. `slug`), the frontmatter value wins.

```ts
const post = queryCollection("posts").where({ slug: "hello" }).first();
post.title;      // from frontmatter
post.body;       // raw MDX content — no fs.readFile needed
post.locale;     // "pt" if filename is "hello.pt.mdx"
post.collection; // "posts"
```

### Internal Indexed Format (`ContentEntry`)

Internally, entries are stored with `data` nested separately:

```ts
interface ContentEntry {
  collection: string;
  slug: string;
  path: string;
  body?: string;
  data: Record<string, unknown>;
  locale?: string;
}
```

The query builder flattens `data` into the result so consumers get a single flat object.

## Direct Array Usage

`queryCollection()` returns a `QueryResult<T>` — a Proxy that behaves as both a fluent builder and a native array. You can use `.map()`, `.filter()`, `.length`, spread, and all other array methods directly.

```ts
// No need to call .all() — array methods work directly
const titles = queryCollection("blog").map(post => post.title);
const count = queryCollection("blog").length;
const [first, ...rest] = queryCollection("blog");
```

## Examples

### All published posts, newest first

```ts
import { queryCollection } from "nextjs-studio/server";

const posts = queryCollection("blog")
  .where({ published: true })
  .sort("date", "desc")
  .all();
```

### Singleton collection (JSON object)

```ts
const about = queryCollection("about").one();
// about.name, about.bio, etc. — fully typed
```

### Single post by slug

```ts
const post = queryCollection("blog")
  .where({ slug: params.slug })
  .first();

if (!post) notFound();

// Access everything directly — no fs needed
post.title;  // frontmatter
post.body;   // MDX content
post.locale; // locale from filename
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
