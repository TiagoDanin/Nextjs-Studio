/**
 * @context  Core layer — frontmatter binder at src/core/frontmatter-binder.ts
 * @does     Replaces {frontmatter.X} tokens in MDX body with actual frontmatter values
 * @depends  none
 * @do       Add new token patterns or transformation rules here
 * @dont     Import from CLI or UI; access filesystem
 */

const TOKEN_REGEX = /\{frontmatter\.([a-zA-Z0-9_.]+)\}/g;

/**
 * Replaces `{frontmatter.X}` tokens in the body with values from the data object.
 * Supports dot-notation for nested values (e.g. `{frontmatter.author.name}`).
 */
export function bindFrontmatter(body: string, data: Record<string, unknown>): string {
  return body.replace(TOKEN_REGEX, (_match, path: string) => {
    const value = resolvePath(data, path);
    if (value === undefined || value === null) return _match;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Extracts all frontmatter token paths from the body.
 */
export function extractFrontmatterTokens(body: string): string[] {
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(TOKEN_REGEX.source, "g");
  while ((match = regex.exec(body)) !== null) {
    tokens.push(match[1]!);
  }
  return tokens;
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
