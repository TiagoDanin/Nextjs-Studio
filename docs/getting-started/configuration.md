# Configuration

nextjs-studio works with zero configuration — collections are auto-detected from the `/contents` directory. For advanced features like import scripts, create a `studio.config.ts` file in your project root.

## studio.config.ts

```ts
import type { StudioConfig } from "nextjs-studio";

const config: StudioConfig = {
  collections: {
    products: {
      scripts: {
        import: "node scripts/import-products.js",
        sync: "node scripts/sync-products.js",
      },
    },
    analytics: {
      scripts: {
        import: "node scripts/import-analytics.js",
      },
    },
  },
};

export default config;
```

## Collection Configuration

### Scripts

Each collection can define import and sync scripts. These are shell commands executed when the user clicks **Import** or **Sync** in the CMS UI.

| Property | Description |
|----------|-------------|
| `scripts.import` | Command to import external data into the collection |
| `scripts.sync` | Command to synchronize the collection with an external source |

**How import works:**

1. User clicks **Import** in the collection UI
2. CLI executes the script using `child_process`
3. Script outputs valid JSON to stdout
4. CLI validates and writes the output to the collection JSON file
5. UI refreshes automatically

Only JSON collections support import scripts. MDX collections do not support this feature.

### Example Import Script

```js
// scripts/import-products.js
const response = await fetch("https://api.example.com/products");
const products = await response.json();

// Output must be valid JSON to stdout
console.log(JSON.stringify(products, null, 2));
```

## Content Collections

Collections are auto-detected from the filesystem. No configuration is needed for basic usage.

### Collection Types

| Structure | Type | CMS View |
|-----------|------|----------|
| Folder with `.mdx` files | MDX Collection | Rich text editor |
| `index.json` with array | JSON Array | Spreadsheet/table |
| `index.json` with object | JSON Object | Form editor |

### Collection Ordering

Add a `collection.json` file inside a collection folder to control entry ordering:

```json
["post-3", "post-1", "post-2"]
```

This defines the display and query order for entries in that collection.

### Nested Collections

Folders can be nested to create hierarchical collections:

```
contents/
└── docs/
    ├── guides/
    │   ├── getting-started.mdx
    │   └── advanced.mdx
    └── api/
        └── reference.mdx
```

This creates paths like `/docs/guides/getting-started` and `/docs/api/reference`.

## Default Behavior

Without a `studio.config.ts`, nextjs-studio:

- Scans `/contents` for all collections
- Auto-detects collection types from file structure
- Serves the CMS UI on port 3030
- Watches for file changes via chokidar
- Supports MDX frontmatter parsing with gray-matter

## Next Steps

- [Introduction](./introduction.md) — Overview of nextjs-studio architecture
- [Installation](./installation.md) — Setup guide
