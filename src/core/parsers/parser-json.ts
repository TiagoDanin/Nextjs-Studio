export interface ParsedJsonArray {
  type: "json-array";
  entries: Record<string, unknown>[];
}

export interface ParsedJsonObject {
  type: "json-object";
  data: Record<string, unknown>;
}

export type ParsedJson = ParsedJsonArray | ParsedJsonObject;

export function parseJson(content: string): ParsedJson {
  const parsed: unknown = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return {
      type: "json-array",
      entries: parsed as Record<string, unknown>[],
    };
  }

  if (typeof parsed === "object" && parsed !== null) {
    return {
      type: "json-object",
      data: parsed as Record<string, unknown>,
    };
  }

  throw new Error("JSON content must be an array or object");
}
