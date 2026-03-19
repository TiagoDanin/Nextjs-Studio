/**
 * @context  Root layout for the studio UI Next.js app (cli/ui/app).
 * @does     Sets up the Poppins font, HTML metadata, theme provider, and the full-height flex shell.
 * @depends  components/providers for ThemeProvider wrapping; globals.css for base styles.
 * @do       Add global providers (e.g. Toaster, QueryClient) that every page needs.
 * @dont     Never add page-specific logic or data fetching here — keep it layout-only.
 */

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Nextjs Studio",
  description: "A Git-based, local-first CMS for Next.js projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">{children}</div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
