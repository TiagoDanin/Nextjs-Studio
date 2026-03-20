/**
 * @context  Core layer — MDX parser/serializer at src/core/parsers/parser-mdx.ts
 * @does     Parses .mdx content into frontmatter + body, and serializes them back to MDX strings
 * @depends  none (gray-matter is an external dep)
 * @do       Add MDX transform steps here; both parse and serialize live here intentionally
 * @dont     Access the filesystem; import from CLI or UI; handle JSON content
 */

import matter from "gray-matter";
import { bindFrontmatter } from "../frontmatter-binder.js";

export interface ParsedMdx {
  data: Record<string, unknown>;
  body: string;
}

export interface ParseMdxOptions {
  /** When true, replaces {frontmatter.X} tokens in the body with actual values. */
  bindTokens?: boolean;
}

/** Convert Date objects produced by gray-matter back to ISO strings. */
function normalizeDates(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = value.toISOString().split("T")[0];
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = normalizeDates(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function parseMdx(content: string, options?: ParseMdxOptions): ParsedMdx {
  const { data: rawData, content: body } = matter(content);
  const data = normalizeDates(rawData);
  const trimmed = body.trim();
  return {
    data,
    body: options?.bindTokens ? bindFrontmatter(trimmed, data) : trimmed,
  };
}

export function serializeMdx(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data);
}
