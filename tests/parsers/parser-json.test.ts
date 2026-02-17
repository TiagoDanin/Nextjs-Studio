import { describe, it, expect } from "vitest";
import { parseJson } from "../../src/core/parsers/parser-json.js";

describe("parseJson", () => {
  describe("json-array", () => {
    it("should parse a JSON array", () => {
      const content = JSON.stringify([
        { name: "A", price: 10 },
        { name: "B", price: 20 },
      ]);

      const result = parseJson(content);

      expect(result.type).toBe("json-array");
      if (result.type === "json-array") {
        expect(result.entries).toHaveLength(2);
        expect(result.entries[0]).toEqual({ name: "A", price: 10 });
        expect(result.entries[1]).toEqual({ name: "B", price: 20 });
      }
    });

    it("should handle empty array", () => {
      const result = parseJson("[]");

      expect(result.type).toBe("json-array");
      if (result.type === "json-array") {
        expect(result.entries).toHaveLength(0);
      }
    });
  });

  describe("json-object", () => {
    it("should parse a JSON object", () => {
      const content = JSON.stringify({ title: "Home", theme: "dark" });

      const result = parseJson(content);

      expect(result.type).toBe("json-object");
      if (result.type === "json-object") {
        expect(result.data).toEqual({ title: "Home", theme: "dark" });
      }
    });

    it("should handle nested objects", () => {
      const content = JSON.stringify({
        title: "Page",
        hero: { title: "Welcome", cta: { text: "Click" } },
      });

      const result = parseJson(content);

      expect(result.type).toBe("json-object");
      if (result.type === "json-object") {
        expect(result.data.hero).toEqual({
          title: "Welcome",
          cta: { text: "Click" },
        });
      }
    });
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseJson("not json")).toThrow();
  });

  it("should throw on primitive JSON values", () => {
    expect(() => parseJson('"just a string"')).toThrow(
      "JSON content must be an array or object",
    );
    expect(() => parseJson("42")).toThrow(
      "JSON content must be an array or object",
    );
    expect(() => parseJson("true")).toThrow(
      "JSON content must be an array or object",
    );
    expect(() => parseJson("null")).toThrow(
      "JSON content must be an array or object",
    );
  });
});
