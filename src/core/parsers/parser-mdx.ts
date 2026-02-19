import matter from "gray-matter";

export interface ParsedMdx {
  data: Record<string, unknown>;
  body: string;
}

export function parseMdx(content: string): ParsedMdx {
  const { data, content: body } = matter(content);
  return { data, body: body.trim() };
}

export function serializeMdx(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data);
}
