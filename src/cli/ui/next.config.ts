import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "../../..");

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  transpilePackages: [],
  allowedDevOrigins: ["*"],
  webpack: (config) => {
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
