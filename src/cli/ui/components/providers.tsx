"use client";

/**
 * @context  Client-side provider wrapper for the studio UI (cli/ui/components).
 * @does     Wraps the app in next-themes ThemeProvider for dark/light mode support.
 * @depends  next-themes for theme management.
 * @do       Add new global providers (e.g. QueryClientProvider, Toaster) here.
 * @dont     Never add page-specific logic — this component wraps the entire app tree.
 */

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
