"use client";

/**
 * @context  UI hook — watch mode at src/cli/ui/hooks/use-watch.ts
 * @does     Connects to the SSE /api/watch endpoint and triggers router.refresh() on content changes
 * @depends  next/navigation
 * @do       Add debouncing or selective refresh logic here
 * @dont     Put watcher setup or file system logic here — that belongs in the API route
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useWatch() {
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/watch");
    esRef.current = es;

    es.onmessage = () => {
      router.refresh();
    };

    es.onerror = () => {
      // EventSource auto-reconnects; no action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [router]);
}
