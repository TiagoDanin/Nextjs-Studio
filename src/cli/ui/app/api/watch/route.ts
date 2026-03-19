/**
 * @context  API route — SSE watch endpoint at src/cli/ui/app/api/watch/route.ts
 * @does     Streams content change events via Server-Sent Events using the ContentWatcher singleton
 * @depends  @cli/adapters/watcher, lib/env
 * @do       Add new SSE event types (e.g. config reload) here
 * @dont     Put business logic here — the watcher handles detection and debouncing
 */

import { getWatcher } from "@cli/adapters/watcher";
import { getContentsDir } from "@/lib/env";
import type { WatchEvent } from "@shared/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const contentsDir = getContentsDir();
  const watcher = getWatcher(contentsDir);

  if (!watcher.isRunning()) {
    await watcher.start();
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: WatchEvent) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          cleanup();
        }
      }

      function onAdd(event: WatchEvent) { send(event); }
      function onChange(event: WatchEvent) { send(event); }
      function onDelete(event: WatchEvent) { send(event); }

      watcher.on("content:add", onAdd);
      watcher.on("content:change", onChange);
      watcher.on("content:delete", onDelete);

      // Send heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 30_000);

      function cleanup() {
        clearInterval(heartbeat);
        watcher.off("content:add", onAdd);
        watcher.off("content:change", onChange);
        watcher.off("content:delete", onDelete);
      }

      // Clean up when the client disconnects
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
