/**
 * @context  Core layer — config loader at src/core/config-loader.ts
 * @does     Resolves and loads studio.config.ts/.js from the project root using dynamic import
 * @depends  src/shared/constants.ts, src/shared/types.ts
 * @do       Add new config resolution strategies or validation here
 * @dont     Import from CLI or UI; access content files
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { StudioConfig } from "../shared/types.js";
import { CONFIG_FILENAMES } from "../shared/constants.js";

/**
 * Resolves the config file path from the project root.
 * Returns undefined if no config file is found.
 */
export function resolveConfigPath(projectRoot: string): string | undefined {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = path.resolve(projectRoot, filename);
    if (existsSync(fullPath)) return fullPath;
  }
  return undefined;
}

/**
 * Loads the studio config from the project root.
 * Tries CONFIG_FILENAMES in order, uses dynamic import().
 * Returns empty config if no file found or loading fails.
 */
export async function loadStudioConfig(projectRoot: string): Promise<StudioConfig> {
  const configPath = resolveConfigPath(projectRoot);
  if (!configPath) return {};

  return loadConfigFromPath(configPath);
}

/**
 * Loads config from a specific file path.
 * Uses tsx's tsImport for .ts files so TypeScript configs work at runtime.
 */
export async function loadConfigFromPath(configPath: string): Promise<StudioConfig> {
  try {
    let mod: Record<string, unknown>;

    if (configPath.endsWith(".ts")) {
      // Use tsx to transpile TypeScript configs on the fly
      const { tsImport } = await import(/* webpackIgnore: true */ "tsx/esm/api");
      const fileUrl = pathToFileURL(configPath).href;
      mod = await tsImport(fileUrl, import.meta.url) as Record<string, unknown>;
    } else {
      const fileUrl = pathToFileURL(configPath).href;
      mod = await import(/* webpackIgnore: true */ fileUrl);
    }

    const config = mod.default ?? mod.config ?? mod;

    if (typeof config !== "object" || config === null || Array.isArray(config)) {
      return {};
    }

    return config as StudioConfig;
  } catch {
    return {};
  }
}
