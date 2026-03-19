import { describe, it, expect } from "vitest";
import {
  bindFrontmatter,
  extractFrontmatterTokens,
} from "../src/core/frontmatter-binder.js";

describe("bindFrontmatter", () => {
  it("should replace a simple token", () => {
    const body = "Hello {frontmatter.name}!";
    const data = { name: "World" };

    expect(bindFrontmatter(body, data)).toBe("Hello World!");
  });

  it("should replace multiple tokens", () => {
    const body = "By {frontmatter.author} on {frontmatter.date}";
    const data = { author: "Alice", date: "2026-01-15" };

    expect(bindFrontmatter(body, data)).toBe("By Alice on 2026-01-15");
  });

  it("should replace the same token appearing multiple times", () => {
    const body = "{frontmatter.name} is {frontmatter.name}";
    const data = { name: "Alice" };

    expect(bindFrontmatter(body, data)).toBe("Alice is Alice");
  });

  it("should support dot-notation for nested values", () => {
    const body = "Welcome, {frontmatter.author.name}!";
    const data = { author: { name: "Bob" } };

    expect(bindFrontmatter(body, data)).toBe("Welcome, Bob!");
  });

  it("should support deeply nested paths", () => {
    const body = "{frontmatter.a.b.c}";
    const data = { a: { b: { c: "deep" } } };

    expect(bindFrontmatter(body, data)).toBe("deep");
  });

  it("should leave token unchanged when value is missing", () => {
    const body = "Hello {frontmatter.missing}!";
    const data = { name: "World" };

    expect(bindFrontmatter(body, data)).toBe("Hello {frontmatter.missing}!");
  });

  it("should leave token unchanged when nested path is missing", () => {
    const body = "{frontmatter.author.email}";
    const data = { author: { name: "Alice" } };

    expect(bindFrontmatter(body, data)).toBe("{frontmatter.author.email}");
  });

  it("should leave token unchanged when intermediate path is not an object", () => {
    const body = "{frontmatter.title.nested}";
    const data = { title: "just a string" };

    expect(bindFrontmatter(body, data)).toBe("{frontmatter.title.nested}");
  });

  it("should leave token unchanged for null values", () => {
    const body = "{frontmatter.value}";
    const data = { value: null };

    expect(bindFrontmatter(body, data)).toBe("{frontmatter.value}");
  });

  it("should convert number values to string", () => {
    const body = "Count: {frontmatter.count}";
    const data = { count: 42 };

    expect(bindFrontmatter(body, data)).toBe("Count: 42");
  });

  it("should convert boolean values to string", () => {
    const body = "Published: {frontmatter.published}";
    const data = { published: true };

    expect(bindFrontmatter(body, data)).toBe("Published: true");
  });

  it("should JSON.stringify object values", () => {
    const body = "Meta: {frontmatter.meta}";
    const data = { meta: { a: 1, b: 2 } };

    expect(bindFrontmatter(body, data)).toBe('Meta: {"a":1,"b":2}');
  });

  it("should JSON.stringify array values", () => {
    const body = "Tags: {frontmatter.tags}";
    const data = { tags: ["a", "b"] };

    expect(bindFrontmatter(body, data)).toBe('Tags: ["a","b"]');
  });

  it("should return body unchanged when no tokens are present", () => {
    const body = "No tokens here";
    const data = { title: "Hello" };

    expect(bindFrontmatter(body, data)).toBe("No tokens here");
  });

  it("should return body unchanged when data is empty", () => {
    const body = "{frontmatter.title}";
    const data = {};

    expect(bindFrontmatter(body, data)).toBe("{frontmatter.title}");
  });

  it("should handle zero as a valid value", () => {
    const body = "Value: {frontmatter.num}";
    const data = { num: 0 };

    expect(bindFrontmatter(body, data)).toBe("Value: 0");
  });

  it("should handle empty string as a valid value", () => {
    const body = "Value: {frontmatter.text}";
    const data = { text: "" };

    expect(bindFrontmatter(body, data)).toBe("Value: ");
  });
});

describe("extractFrontmatterTokens", () => {
  it("should extract a single token", () => {
    const body = "Hello {frontmatter.name}!";
    expect(extractFrontmatterTokens(body)).toEqual(["name"]);
  });

  it("should extract multiple tokens", () => {
    const body = "{frontmatter.author} wrote {frontmatter.title}";
    expect(extractFrontmatterTokens(body)).toEqual(["author", "title"]);
  });

  it("should extract dot-notation tokens", () => {
    const body = "{frontmatter.author.name} ({frontmatter.author.email})";
    expect(extractFrontmatterTokens(body)).toEqual(["author.name", "author.email"]);
  });

  it("should extract deeply nested tokens", () => {
    const body = "{frontmatter.a.b.c.d}";
    expect(extractFrontmatterTokens(body)).toEqual(["a.b.c.d"]);
  });

  it("should return empty array when no tokens are present", () => {
    expect(extractFrontmatterTokens("No tokens here")).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    expect(extractFrontmatterTokens("")).toEqual([]);
  });

  it("should extract duplicate tokens", () => {
    const body = "{frontmatter.name} is {frontmatter.name}";
    expect(extractFrontmatterTokens(body)).toEqual(["name", "name"]);
  });

  it("should handle tokens with underscores in paths", () => {
    const body = "{frontmatter.first_name}";
    expect(extractFrontmatterTokens(body)).toEqual(["first_name"]);
  });

  it("should handle tokens with numbers in paths", () => {
    const body = "{frontmatter.item1}";
    expect(extractFrontmatterTokens(body)).toEqual(["item1"]);
  });
});
