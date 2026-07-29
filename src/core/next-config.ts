/**
 * @context  Core layer — Next.js config helper at src/core/next-config.ts
 * @does     Wraps a Next.js config so the dev server watches the contents directory
 * @depends  src/shared/constants.ts
 * @do       Wrap next.config with withStudio() so content edits hot reload the browser
 * @dont     Import from client components; this runs inside next.config only
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENTS_DIR } from "../shared/constants.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAMP_LOADER = path.join(HERE, "content-stamp-loader.cjs");

/**
 * The studio server entry, which every page reading content pulls in. Resolved
 * from this file instead of matched by name: with `yarn link` or `portal:` the
 * package lives outside node_modules, under whatever casing the clone has.
 */
const SERVER_MODULE_PATHS = ((): string[] => {
  const direct = path.join(HERE, "server.js");
  try {
    const real = fs.realpathSync(direct);
    return real === direct ? [direct] : [direct, real];
  } catch {
    return [direct];
  }
})();

const CASE_INSENSITIVE_FS = process.platform === "win32" || process.platform === "darwin";

function isServerModule(resource: string): boolean {
  if (!resource) return false;
  const target = CASE_INSENSITIVE_FS ? resource.toLowerCase() : resource;
  return SERVER_MODULE_PATHS.some(candidate =>
    CASE_INSENSITIVE_FS ? candidate.toLowerCase() === target : candidate === target
  );
}

interface WebpackCompilation {
  contextDependencies: Set<string>;
}

interface WebpackCompiler {
  hooks: {
    afterCompile: {
      tap(name: string, handler: (compilation: WebpackCompilation) => void): void;
    };
  };
}

interface WebpackModuleRule {
  test: (resource: string) => boolean;
  use: { loader: string; options: { contentsDir: string } }[];
}

interface WebpackSnapshot {
  unmanagedPaths?: unknown[];
}

interface WebpackConfig {
  plugins?: unknown[];
  module?: { rules?: unknown[] };
  snapshot?: WebpackSnapshot;
}

interface WebpackContext {
  dev: boolean;
  isServer: boolean;
}

type WebpackConfigFn = (config: WebpackConfig, context: WebpackContext) => WebpackConfig;

/**
 * Any Next.js config object. Kept structural on purpose: nextjs-studio does not
 * depend on `next`, and NextConfig types `webpack` loosely enough that a
 * narrower signature here would reject a valid config.
 */
export type StudioNextConfig = object;

export interface WithStudioOptions {
  /** Collections directory. Relative paths resolve from process.cwd(). Defaults to `contents`. */
  contentsDir?: string;
}

/**
 * Registers the contents directory as a webpack context dependency so the dev
 * watcher picks up files that are read through fs and therefore never enter the
 * module graph.
 */
class StudioWatchPlugin {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.afterCompile.tap("NextjsStudioWatchPlugin", compilation => {
      compilation.contextDependencies.add(this.dir);
    });
  }
}

let turbopackWarned = false;

function warnIfTurbopack(): void {
  if (turbopackWarned) return;
  if (process.env.NODE_ENV !== "development") return;
  if (!process.env.TURBOPACK && !process.env.NEXT_TURBOPACK) return;

  turbopackWarned = true;
  console.warn(
    "[nextjs-studio] Turbopack has no plugin API, so content edits cannot trigger a browser refresh. " +
      "Run `next dev --webpack` for hot reload on contents/, or refresh the page manually."
  );
}

/**
 * Makes `contents/` hot reload in `next dev`.
 *
 * The content index itself is already kept fresh by the dev watcher in
 * `nextjs-studio/server`, so a fresh request always renders current data. What
 * is missing is the signal to the browser: content files are read with fs, stay
 * outside the module graph, and saving one triggers no rebuild. The open tab
 * keeps showing stale content until a manual refresh.
 *
 * This wrapper adds the directory to the dev watcher, so saving a JSON or MDX
 * file recompiles the server and Next pushes a server-component change to the
 * browser, the same as editing a source file.
 *
 * @example
 * ```ts
 * import { withStudio } from "nextjs-studio/next";
 *
 * export default withStudio({
 *   output: "export",
 * });
 * ```
 */
export function withStudio<T extends StudioNextConfig>(
  nextConfig: T = {} as T,
  options: WithStudioOptions = {}
): T {
  const configured = options.contentsDir ?? CONTENTS_DIR;
  const dir = path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);

  const existingWebpack = (nextConfig as { webpack?: WebpackConfigFn }).webpack;

  const wrapped = {
    ...nextConfig,
    webpack(config: WebpackConfig, context: WebpackContext): WebpackConfig {
      const result = existingWebpack ? existingWebpack(config, context) : config;

      if (context.dev && context.isServer) {
        result.plugins = result.plugins ?? [];
        result.plugins.push(new StudioWatchPlugin(dir));

        // Puts the content fingerprint inside a module Next actually diffs.
        const stampRule: WebpackModuleRule = {
          test: isServerModule,
          use: [{ loader: STAMP_LOADER, options: { contentsDir: dir } }],
        };

        result.module = result.module ?? {};
        result.module.rules = result.module.rules ?? [];
        result.module.rules.push(stampRule);

        // Next marks everything under node_modules as managed, meaning webpack
        // assumes it never changes and skips rebuilding it. The stamped module
        // has to stay rebuildable for the fingerprint to be picked up again.
        result.snapshot = result.snapshot ?? {};
        result.snapshot.unmanagedPaths = [
          ...(result.snapshot.unmanagedPaths ?? []),
          /[\\/]node_modules[\\/]nextjs-studio[\\/]/,
        ];
      }

      return result;
    },
  };

  warnIfTurbopack();

  return wrapped as T;
}
