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

export function parseMdx(content: string, options?: ParseMdxOptions): ParsedMdx {
  const { data, content: body } = matter(content);
  const trimmed = body.trim();
  return {
    data,
    body: options?.bindTokens ? bindFrontmatter(trimmed, data) : trimmed,
  };
}

export function serializeMdx(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data);
}
