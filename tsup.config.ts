import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      "core/index": "src/core/index.ts",
      "core/server": "src/core/server.ts",
      "bin/nextjs-studio": "src/bin/nextjs-studio.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node20",
    splitting: false,
  },
  {
    /**
     * next.config is loaded through `require`, so this entry also ships CJS.
     * Without it Node throws ERR_PACKAGE_PATH_NOT_EXPORTED on `nextjs-studio/next`.
     */
    entry: {
      "core/next-config": "src/core/next-config.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    shims: true,
    sourcemap: true,
    clean: false,
    target: "node20",
    splitting: false,
  },
  {
    /** webpack resolves loaders by path and requires them, so CJS only. */
    entry: {
      "core/content-stamp-loader": "src/core/content-stamp-loader.ts",
    },
    format: ["cjs"],
    dts: false,
    shims: true,
    sourcemap: true,
    clean: false,
    target: "node20",
    splitting: false,
  },
]);
