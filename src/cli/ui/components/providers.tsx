"use client";

/**
 * @context  Client-side provider wrapper for the studio UI (cli/ui/components).
 * @does     Wraps the app in next-themes ThemeProvider and WatchProvider for live reload.
 * @depends  next-themes for theme management, @/hooks/use-watch for SSE file watching.
 * @do       Add new global providers (e.g. QueryClientProvider, Toaster) here.
 * @dont     Never add page-specific logic — this component wraps the entire app tree.
 */

import { ThemeProvider } from "next-themes";
import { useWatch } from "@/hooks/use-watch";

function WatchProvider({ children }: { children: React.ReactNode }) {
  useWatch();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WatchProvider>{children}</WatchProvider>
    </ThemeProvider>
  );
}
