#!/usr/bin/env node

/**
 * @context  bin layer — CLI entry point at src/bin/nextjs-studio.ts
 * @does     Parses CLI args, resolves paths, and spawns the UI server process
 * @depends  src/shared/constants.ts
 * @do       Add new CLI flags here; keep only process bootstrap logic
 * @dont     Import UI components, access the filesystem beyond existsSync, or contain business logic
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { Command } from "commander";
import { CLI_PORT, CONTENTS_DIR } from "../shared/constants.js";

const { version } = await import("../../package.json", { with: { type: "json" } });

const program = new Command()
  .name("Nextjs Studio")
  .description("Local-first CMS for Next.js projects")
  .version(version)
  .option("-d, --dir <path>", "Path to contents directory", CONTENTS_DIR)
  .option("-p, --port <number>", "Port to run the studio on", String(CLI_PORT))
  .parse();

const opts = program.opts<{ dir: string; port: string }>();
const contentsDir = path.resolve(opts.dir);
const port = Number(opts.port);

const uiDir = path.resolve(import.meta.dirname, "../cli/ui");
const standaloneServer = path.resolve(uiDir, ".next/standalone/src/cli/ui/server.js");

const serverEnv = {
  ...process.env,
  STUDIO_CONTENTS_DIR: contentsDir,
  PORT: String(port),
  HOSTNAME: "0.0.0.0",
};

console.log(`Nextjs Studio v${version}`);
console.log(`Contents: ${contentsDir}`);
console.log(`Starting on http://localhost:${port}`);

function createServerProcess(): ChildProcess {
  if (existsSync(standaloneServer)) {
    return spawn("node", [standaloneServer], { stdio: "inherit", env: serverEnv });
  }

  return spawn("npx", ["next", "dev", "--port", String(port), "--webpack"], {
    cwd: uiDir,
    stdio: "inherit",
    shell: true,
    env: serverEnv,
  });
}

function registerSignalForwarding(child: ChildProcess): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => child.kill(signal));
  }
}

const serverProcess = createServerProcess();

serverProcess.on("error", (error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

serverProcess.on("close", (code) => process.exit(code ?? 0));

registerSignalForwarding(serverProcess);
