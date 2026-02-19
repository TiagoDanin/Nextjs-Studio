import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "nextjs-studio",
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
          <div className="flex h-screen flex-col">
            <header className="flex h-14 items-center justify-between border-b px-4">
              <h1 className="text-sm font-semibold tracking-tight">
                NextJS Studio
              </h1>
              <ThemeToggle />
            </header>
            <div className="flex flex-1 overflow-hidden">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
