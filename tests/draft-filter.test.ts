import { describe, it, expect } from "vitest";
import { isDraft, filterDrafts } from "../src/core/draft-filter.js";
import type { ContentEntry } from "../src/shared/types.js";

function makeEntry(overrides: Partial<ContentEntry> & { data: Record<string, unknown> }): ContentEntry {
  return {
    collection: "blog",
    slug: "test",
    path: "/blog/test",
    ...overrides,
  };
}

describe("isDraft", () => {
  it("should return true when data.draft is true", () => {
    const entry = makeEntry({ data: { draft: true } });
    expect(isDraft(entry)).toBe(true);
  });

  it("should return false when data.draft is false", () => {
    const entry = makeEntry({ data: { draft: false } });
    expect(isDraft(entry)).toBe(false);
  });

  it("should return false when data.draft is undefined", () => {
    const entry = makeEntry({ data: { title: "Hello" } });
    expect(isDraft(entry)).toBe(false);
  });

  it("should return false when data.draft is a truthy non-boolean value", () => {
    const entry = makeEntry({ data: { draft: "yes" } });
    expect(isDraft(entry)).toBe(false);
  });

  it("should return false when data.draft is 1 (not strictly true)", () => {
    const entry = makeEntry({ data: { draft: 1 } });
    expect(isDraft(entry)).toBe(false);
  });

  it("should return false when data.draft is null", () => {
    const entry = makeEntry({ data: { draft: null } });
    expect(isDraft(entry)).toBe(false);
  });

  it("should return false when data is empty", () => {
    const entry = makeEntry({ data: {} });
    expect(isDraft(entry)).toBe(false);
  });
});

describe("filterDrafts", () => {
  it("should remove entries where draft is true", () => {
    const entries: ContentEntry[] = [
      makeEntry({ slug: "published", data: { title: "Published", draft: false } }),
      makeEntry({ slug: "draft", data: { title: "Draft", draft: true } }),
      makeEntry({ slug: "no-flag", data: { title: "No Flag" } }),
    ];

    const result = filterDrafts(entries);

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.slug)).toEqual(["published", "no-flag"]);
  });

  it("should return all entries when none are drafts", () => {
    const entries: ContentEntry[] = [
      makeEntry({ slug: "a", data: { draft: false } }),
      makeEntry({ slug: "b", data: {} }),
    ];

    const result = filterDrafts(entries);
    expect(result).toHaveLength(2);
  });

  it("should return empty array when all are drafts", () => {
    const entries: ContentEntry[] = [
      makeEntry({ slug: "a", data: { draft: true } }),
      makeEntry({ slug: "b", data: { draft: true } }),
    ];

    const result = filterDrafts(entries);
    expect(result).toHaveLength(0);
  });

  it("should return empty array for empty input", () => {
    expect(filterDrafts([])).toEqual([]);
  });
});
