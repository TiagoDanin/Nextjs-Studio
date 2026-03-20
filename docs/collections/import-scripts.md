# Sync Scripts

Sync scripts let you pull data from external sources directly from the CMS UI. When triggered, the CLI runs a shell command, captures the output, validates it, and writes it to the collection file.

> **Note:** Sync scripts only work with JSON collections (array or object). MDX collections do not support this feature.

## Setup

Add a sync script to a collection in `studio.config.ts`:

```ts
// studio.config.ts
import type { StudioConfig } from "nextjs-studio";

const config: StudioConfig = {
  collections: {
    github: {
      scripts: {
        sync: "tsx scripts/getProjectsGithub.ts",
      },
    },
  },
};

export default config;
```

| Script | Triggered by | Description |
|--------|-------------|-------------|
| `sync` | **Sync** button in the CMS toolbar | Synchronize the collection with an external source |

## Writing a script

Your script must print valid JSON to `stdout`. The CLI captures this output and writes it to the collection's `index.json`.

```js
// scripts/sync-products.js
const response = await fetch("https://api.example.com/products");
const products = await response.json();

// Must output valid JSON to stdout
console.log(JSON.stringify(products, null, 2));
```

For an object collection:

```js
// scripts/sync-settings.js
const response = await fetch("https://api.example.com/settings");
const settings = await response.json();

console.log(JSON.stringify(settings, null, 2));
```

## How it works

1. User clicks **Sync** in the collection toolbar
2. The CLI executes the script via `child_process`
3. The script writes JSON to `stdout`
4. The CLI validates and writes the output to `contents/<collection>/index.json`
5. The file watcher detects the change and the UI refreshes automatically

## Error handling

If your script exits with a non-zero code or writes invalid JSON, the sync fails and the existing file is left unchanged. Print errors to `stderr` — only `stdout` is used as output.

```js
// scripts/sync-products.js
try {
  const response = await fetch("https://api.example.com/products");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const products = await response.json();
  console.log(JSON.stringify(products, null, 2));
} catch (err) {
  console.error("Sync failed:", err.message);
  process.exit(1);
}
```

## Next steps

- [Configuration](../getting-started/configuration.md) — full `studio.config.ts` reference
- [Collections](./overview.md) — JSON array and JSON object collection types
