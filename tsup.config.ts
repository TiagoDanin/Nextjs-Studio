import { defineConfig } from "tsup";

export default defineConfig({
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
});
