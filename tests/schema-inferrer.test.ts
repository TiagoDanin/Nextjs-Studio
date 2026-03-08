import { describe, it, expect } from "vitest";
import { inferSchema } from "../src/core/schema-inferrer.js";
import type { ContentEntry } from "../src/shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntries(data: Record<string, unknown>[]): ContentEntry[] {
  return data.map((d, i) => ({
    collection: "test",
    slug: `entry-${i}`,
    path: `/test/entry-${i}`,
    data: d,
  }));
}

// ---------------------------------------------------------------------------
// Scalar types
// ---------------------------------------------------------------------------

describe("inferSchema — scalar types", () => {
  it("infers text for short strings", () => {
    const entries = makeEntries([{ title: "Hello" }, { title: "World" }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "title");
    expect(field?.type).toBe("text");
  });

  it("infers long-text when any string exceeds 200 chars", () => {
    const entries = makeEntries([{ body: "a".repeat(201) }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "body");
    expect(field?.type).toBe("long-text");
  });

  it("infers long-text when a string contains newlines", () => {
    const entries = makeEntries([{ content: "line1\nline2" }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "content");
    expect(field?.type).toBe("long-text");
  });

  it("infers boolean", () => {
    const entries = makeEntries([{ published: true }, { published: false }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "published");
    expect(field?.type).toBe("boolean");
  });

  it("infers number with integer format", () => {
    const entries = makeEntries([{ views: 100 }, { views: 200 }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "views");
    expect(field?.type).toBe("number");
    expect((field as any).format).toBe("integer");
  });

  it("infers number with decimal format", () => {
    const entries = makeEntries([{ price: 9.99 }, { price: 4.5 }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "price");
    expect(field?.type).toBe("number");
    expect((field as any).format).toBe("decimal");
  });

  it("infers email", () => {
    const entries = makeEntries([
      { contact: "alice@example.com" },
      { contact: "bob@example.com" },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "contact");
    expect(field?.type).toBe("email");
  });

  it("infers url", () => {
    const entries = makeEntries([
      { website: "https://example.com" },
      { website: "https://foo.dev" },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "website");
    expect(field?.type).toBe("url");
  });

  it("infers date without time", () => {
    const entries = makeEntries([{ date: "2025-01-15" }, { date: "2025-03-08" }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "date");
    expect(field?.type).toBe("date");
    expect((field as any).includeTime).toBeFalsy();
  });

  it("infers date with includeTime for ISO datetimes", () => {
    const entries = makeEntries([
      { publishedAt: "2025-01-15T10:30:00.000Z" },
      { publishedAt: "2025-03-08T14:00:00Z" },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "publishedAt");
    expect(field?.type).toBe("date");
    expect((field as any).includeTime).toBe(true);
  });

  it("falls back to text for mixed/unknown string values", () => {
    const entries = makeEntries([{ misc: "foo" }, { misc: "bar" }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "misc");
    expect(field?.type).toBe("text");
  });

  it("infers text for empty entries", () => {
    const entries = makeEntries([{ title: null }, { title: undefined }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "title");
    expect(field?.type).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// Array types
// ---------------------------------------------------------------------------

describe("inferSchema — array types", () => {
  it("infers multi-select for array of strings", () => {
    const entries = makeEntries([
      { tags: ["ts", "react"] },
      { tags: ["ts", "nextjs"] },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "tags");
    expect(field?.type).toBe("multi-select");
    const values = (field as any).options.map((o: any) => o.value);
    expect(values).toContain("ts");
    expect(values).toContain("react");
    expect(values).toContain("nextjs");
  });

  it("infers array with itemFields for array of objects", () => {
    const entries = makeEntries([
      { links: [{ label: "GitHub", url: "https://github.com" }] },
      { links: [{ label: "Blog", url: "https://blog.dev" }] },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "links");
    expect(field?.type).toBe("array");
    const itemFields = (field as any).itemFields as any[];
    expect(itemFields.find((f: any) => f.name === "label")?.type).toBe("text");
    expect(itemFields.find((f: any) => f.name === "url")?.type).toBe("url");
  });

  it("infers array with empty itemFields for empty arrays", () => {
    const entries = makeEntries([{ items: [] }]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "items");
    expect(field?.type).toBe("array");
    expect((field as any).itemFields).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Object type
// ---------------------------------------------------------------------------

describe("inferSchema — object type", () => {
  it("infers object with nested fields", () => {
    const entries = makeEntries([
      { seo: { metaTitle: "Hello", metaDescription: "Desc" } },
      { seo: { metaTitle: "World", metaDescription: "Other" } },
    ]);
    const schema = inferSchema(entries, "test");
    const field = schema.fields.find((f) => f.name === "seo");
    expect(field?.type).toBe("object");
    const nested = (field as any).fields as any[];
    expect(nested.find((f: any) => f.name === "metaTitle")?.type).toBe("text");
    expect(nested.find((f: any) => f.name === "metaDescription")?.type).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// Schema metadata
// ---------------------------------------------------------------------------

describe("inferSchema — schema metadata", () => {
  it("sets the correct collection name", () => {
    const schema = inferSchema(makeEntries([{ title: "Hi" }]), "blog");
    expect(schema.collection).toBe("blog");
  });

  it("collects all keys from all entries (union of keys)", () => {
    const entries = makeEntries([
      { title: "A", date: "2025-01-01" },
      { title: "B", published: true },
    ]);
    const schema = inferSchema(entries, "blog");
    const names = schema.fields.map((f) => f.name);
    expect(names).toContain("title");
    expect(names).toContain("date");
    expect(names).toContain("published");
  });

  it("returns an empty fields array for empty entries", () => {
    const schema = inferSchema([], "empty");
    expect(schema.fields).toEqual([]);
  });
});
