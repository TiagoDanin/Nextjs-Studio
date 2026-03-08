#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { CLI_PORT, CONTENTS_DIR } from "../shared/constants.js";

const program = new Command()
  .name("Nextjs Studio")
  .description("A Git-based, local-first CMS for Next.js projects")
  .version("0.1.0")
  .option("-d, --dir <path>", "Path to contents directory", CONTENTS_DIR)
  .option("-p, --port <number>", "Port to run the studio on", String(CLI_PORT))
  .parse();

const opts = program.opts<{ dir: string; port: string }>();
const dir = path.resolve(opts.dir);
const port = Number(opts.port);

const uiDir = path.resolve(import.meta.dirname, "../cli/ui");
const standaloneServer = path.resolve(uiDir, ".next/standalone/src/cli/ui/server.js");

const env = {
  ...process.env,
  STUDIO_CONTENTS_DIR: dir,
  PORT: String(port),
  HOSTNAME: "0.0.0.0",
};

console.log("Nextjs Studio v0.1.0");
console.log(`Contents dir: ${dir}`);
console.log(`Starting on http://localhost:${port}`);

let child: ReturnType<typeof spawn>;

if (fs.existsSync(standaloneServer)) {
  child = spawn("node", [standaloneServer], {
    stdio: "inherit",
    env,
  });
} else {
  child = spawn("npx", ["next", "dev", "--port", String(port), "--webpack"], {
    cwd: uiDir,
    stdio: "inherit",
    shell: true,
    env,
  });
}

child.on("error", (error) => {
  console.error("Failed to start nextjs-studio:", error.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
