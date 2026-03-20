# API Reference

Complete reference for the public API exported from `nextjs-studio` and `nextjs-studio/server`.

The package exposes two entry points:

| Entry point | Use in | Auto-inits store |
|-------------|--------|-----------------|
| `nextjs-studio` | Client-safe types and pure utilities | No |
| `nextjs-studio/server` | Server components and build-time scripts | Yes |

## Content Querying

### `queryCollection(name)`

Returns a fluent query builder for the named collection. Call is synchronous — no `await` required. See [Query API](./query-api.md) for full documentation.

Import from `nextjs-studio/server` in server components and page files:

```ts
import { queryCollection } from "nextjs-studio/server";

const posts = queryCollection("blog").where({ published: true }).all();
```

### `loadContent(fsAdapter, config?)`

Indexes the contents directory and populates the content store. Import from `nextjs-studio/server`.

```ts
import { loadContent } from "nextjs-studio/server";
```

## Configuration

### `loadStudioConfig(projectRoot)`

Loads the studio config from the project root. Looks for `studio.config.ts`, `.js`, or `.mjs`.

```ts
const config = await loadStudioConfig(process.cwd());
```

### `resolveConfigPath(projectRoot)`

Returns the absolute path to the config file, or `undefined` if not found.

### `loadConfigFromPath(configPath)`

Loads config from a specific file path using dynamic `import()`.

## Draft Filtering

### `isDraft(entry)`

Returns `true` if `entry.data.draft === true`.

### `filterDrafts(entries)`

Returns a new array with draft entries removed.

## Frontmatter Binding

### `bindFrontmatter(body, data)`

Replaces `{frontmatter.X}` tokens in the body with values from the data object. Supports dot notation for nested paths.

```ts
const result = bindFrontmatter(
  "Welcome, {frontmatter.author.name}!",
  { author: { name: "Alice" } },
);
// "Welcome, Alice!"
```

### `extractFrontmatterTokens(body)`

Returns an array of token paths found in the body.

```ts
extractFrontmatterTokens("By {frontmatter.author}");
// ["author"]
```

## Locale Parsing

### `parseLocaleFromFilename(filename)`

Extracts locale code from a filename. Returns `undefined` for files without a locale suffix.

```ts
parseLocaleFromFilename("post.pt.mdx"); // "pt"
parseLocaleFromFilename("post.mdx");    // undefined
```

### `stripLocaleFromSlug(slug, locale)`

Removes the locale suffix from a slug.

```ts
stripLocaleFromSlug("post.pt", "pt"); // "post"
```

## Component Registry

### `loadComponentRegistry(config)`

Extracts `ComponentDefinition[]` from the studio config.

### `serializeComponentProps(props)`

Converts a props object to a JSX attributes string.

```ts
serializeComponentProps({ title: "Hello", centered: true });
// 'title="Hello" centered'
```

## Type Generation

### `generateCollectionTypes(schemas)`

Generates a complete TypeScript declaration file string from collection schemas.

### `generateInterfaceForSchema(schema)`

Generates a single TypeScript interface string for one schema.
