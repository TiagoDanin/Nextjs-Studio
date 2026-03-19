#!/usr/bin/env node

/**
 * @context  bin layer — CLI entry point at src/bin/nextjs-studio.ts
 * @does     Parses CLI args, then either generates types or spawns the UI server process
 * @depends  src/shared/constants.ts, src/cli/adapters/fs-adapter.ts, src/core/content-store.ts, src/core/type-generator.ts
 * @do       Add new CLI flags here; keep only process bootstrap logic
 * @dont     Import UI components or contain parsing/indexing business logic
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { Command } from "commander";
import { CLI_PORT, CONTENTS_DIR } from "../shared/constants.js";
import { FsAdapter } from "../cli/adapters/fs-adapter.js";
import { loadContent } from "../core/content-store.js";
import { generateCollectionTypes } from "../core/type-generator.js";
import { loadStudioConfig, resolveConfigPath } from "../core/config-loader.js";
import pkg from "../../package.json" with { type: "json" };

const { version } = pkg;

const program = new Command()
  .name("Nextjs Studio")
  .description("Local-first CMS for Next.js projects")
  .version(version)
  .option("-d, --dir <path>", "Path to contents directory", CONTENTS_DIR)
  .option("-p, --port <number>", "Port to run the studio on", String(CLI_PORT))
  .option("--generate-types", "Generate TypeScript types for content collections")
  .parse();

const opts = program.opts<{ dir: string; port: string; generateTypes?: boolean }>();
const contentsDir = path.resolve(opts.dir);
const port = Number(opts.port);

async function runGenerateTypes(sourceDir: string): Promise<void> {
  const outDir = path.resolve(".studio");
  const outFile = path.join(outDir, "studio.d.ts");

  console.log(`Generating types from ${sourceDir}...`);

  const config = await loadStudioConfig(process.cwd());
  const fsAdapter = new FsAdapter(sourceDir);
  const index = await loadContent(fsAdapter, config);
  const schemas = index.getCollections().flatMap((c) => (c.schema ? [c.schema] : []));
  const code = generateCollectionTypes(schemas);

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, code, "utf-8");

  console.log(`Types written to ${outFile}`);
}

function resolveServerProcess(
  uiDir: string,
  serverPort: number,
  env: NodeJS.ProcessEnv,
): ChildProcess | null {
  const standaloneServer = path.resolve(uiDir, ".next/standalone/src/cli/ui/server.js");
  if (existsSync(standaloneServer)) {
    return spawn("node", [standaloneServer], { stdio: "inherit", env });
  }

  // Dev mode: UI source present (running from repo with `yarn dev`)
  const uiPackageJson = path.resolve(uiDir, "package.json");
  if (existsSync(uiPackageJson)) {
    // Resolve `next` bin from workspace root (3 levels up from src/cli/ui)
    const nextBin = path.resolve(uiDir, "../../../node_modules/next/dist/bin/next");
    return spawn("node", [nextBin, "dev", "--port", String(serverPort), "--webpack"], {
      cwd: uiDir,
      stdio: "inherit",
      env,
    });
  }

  return null;
}

function forwardSignals(child: ChildProcess): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => child.kill(signal));
  }
}

if (opts.generateTypes) {
  await runGenerateTypes(contentsDir);
  process.exit(0);
}

const uiDir = path.resolve(import.meta.dirname, "../cli/ui");
const configPath = resolveConfigPath(process.cwd());
const serverEnv: NodeJS.ProcessEnv = {
  ...process.env,
  STUDIO_CONTENTS_DIR: contentsDir,
  PORT: String(port),
  HOSTNAME: "0.0.0.0",
  ...(configPath ? { STUDIO_CONFIG_PATH: configPath } : {}),
};
const serverProcess = resolveServerProcess(uiDir, port, serverEnv);

if (!serverProcess) {
  console.error("Error: Studio UI server not found.");
  console.error("The pre-built UI is not included in this installation.");
  process.exit(1);
}

console.log(`Nextjs Studio v${version}`);
console.log(`Contents: ${contentsDir}`);
console.log(`Starting on http://localhost:${port}`);

serverProcess.on("error", (error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

serverProcess.on("close", (code) => process.exit(code ?? 0));

forwardSignals(serverProcess);
