/**
 * @context  API route — sync script runner at src/cli/ui/app/api/sync/[collection]/route.ts
 * @does     Executes the sync script defined in studio.config.ts for a given collection
 * @depends  @core/config-loader, lib/env
 * @do       Add timeout, streaming logs, or cancellation support here
 * @dont     Execute arbitrary commands — only run scripts from the validated config
 */

import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { loadConfigFromPath } from "@core/config-loader";
import { getConfigPath } from "../../../../lib/env";

const execAsync = promisify(exec);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;

  const configPath = getConfigPath();
  if (!configPath) {
    return NextResponse.json(
      { error: "No studio.config.ts found" },
      { status: 404 },
    );
  }

  const config = await loadConfigFromPath(configPath);
  const script = config.collections?.[collection]?.scripts?.sync;

  if (!script) {
    return NextResponse.json(
      { error: `No sync script configured for collection "${collection}"` },
      { status: 404 },
    );
  }

  try {
    const cwd = path.dirname(configPath);
    const { stdout, stderr } = await execAsync(script, {
      cwd,
      timeout: 120_000,
      maxBuffer: 50 * 1024 * 1024,
    });

    return NextResponse.json({
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string; stderr?: string; code?: number };
    return NextResponse.json(
      {
        error: err.message ?? "Sync script failed",
        stderr: err.stderr ?? "",
        code: err.code,
      },
      { status: 500 },
    );
  }
}
