import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "../../..");

const config: NextConfig = {
  output: "standalone",
  distDir: "../../../dist/cli/ui/.next",
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ["*"],
  // Fallback rewrite: any path not matched by a studio page/API is forwarded to
  // /api/public/…, which reads from the consumer project's public directory.
  // This lets the studio display images stored at e.g. public/images/posts/.
  async rewrites() {
    return {
      fallback: [{ source: "/:path*", destination: "/api/public/:path*" }],
    };
  },
  // ESM-only packages used server-side must be loaded natively — not bundled by webpack
  serverExternalPackages: ["@sindresorhus/slugify", "@sindresorhus/transliterate", "tsx"],
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@core": path.resolve(import.meta.dirname, "../../core"),
      "@shared": path.resolve(import.meta.dirname, "../../shared"),
      "@cli": path.resolve(import.meta.dirname, "../../cli"),
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default config;
