# Hot Reload

Wrap your Next.js config with `withStudio()` so editing a file in `contents/` refreshes the browser during `next dev`.

```ts
// next.config.ts
import { withStudio } from "nextjs-studio/next";

export default withStudio({
  output: "export",
});
```

Without the wrapper the dev server still serves fresh content on a full page load, but an open tab keeps showing the previous version until you refresh it by hand.

## Why it is needed

`queryCollection()` reads `contents/` through `fs`. Those files never become webpack modules, so:

1. Saving a JSON or MDX file triggers no rebuild.
2. No rebuild means no hash change.
3. Next only sends `serverComponentChanges` to the browser when a server module hash changes.

The content index itself is already kept current by the dev watcher in `nextjs-studio/server`, so this is purely about telling the browser to re-render.

## What the wrapper does

| Step | Effect |
|------|--------|
| Adds `contents/` as a webpack context dependency | The dev watcher notices saves in the directory |
| Stamps the studio server module with a fingerprint of the tree | The module hash changes, so Next detects a real change |
| Marks the package as an unmanaged path | Webpack treats everything in `node_modules` as immutable; the stamped module has to stay rebuildable |

The fingerprint is path, size and mtime of every file under `contents/`, capped at 5000 entries. It is appended as a comment and only in development, so production output is untouched.

## Options

```ts
withStudio(nextConfig, { contentsDir: "content" });
```

| Option | Default | Description |
|--------|---------|-------------|
| `contentsDir` | `contents` | Collections directory. Relative paths resolve from `process.cwd()`. |

An existing `webpack` function in your config is preserved and runs first.

## Turbopack

Turbopack has no plugin API, so this cannot work there. Run `next dev --webpack` for content hot reload. The wrapper prints a warning when it detects Turbopack instead of failing silently.
