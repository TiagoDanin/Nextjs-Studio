# Watch Mode

The studio automatically watches the contents directory for file changes and updates the UI in real time via Server-Sent Events (SSE).

## How It Works

1. The `ContentWatcher` uses chokidar to monitor the contents directory
2. File changes are debounced and emitted as typed events
3. The SSE endpoint at `/api/watch` streams events to the browser
4. The `useWatch()` hook receives events and triggers a `router.refresh()`

## Events

| Event | Trigger |
|-------|---------|
| `content:add` | New file created in a collection |
| `content:change` | Existing file modified |
| `content:delete` | File removed from a collection |

Each event includes:

```ts
interface WatchEvent {
  type: "content:add" | "content:change" | "content:delete";
  collection: string;
  slug: string;
  path: string;
}
```

## SSE Endpoint

`GET /api/watch` returns an `text/event-stream` response. The connection includes:

- A `: connected` comment on initial connection
- JSON `data:` messages for each file change event
- A `: heartbeat` comment every 30 seconds to keep the connection alive

## Singleton Watcher

The watcher is managed as a singleton via `getWatcher(contentsDir)`. Multiple SSE connections share the same watcher instance. The watcher starts automatically on the first SSE connection.

## Incremental Indexing

When the watcher detects changes, the content index is updated incrementally:

| Method | Description |
|--------|-------------|
| `updateEntry(collection, entry)` | Adds or replaces an entry |
| `removeEntry(collection, slug)` | Removes an entry by slug |
| `updateCollectionMeta(collection)` | Recalculates collection metadata |
