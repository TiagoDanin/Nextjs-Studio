import { describe, it, expect } from "vitest";
import { parseMdx } from "../../src/core/parsers/parser-mdx.js";

describe("parseMdx", () => {
  it("should extract frontmatter and body", () => {
    const content = `---
title: Hello World
date: 2026-01-15
published: true
---

# Hello World

Some content here.`;

    const result = parseMdx(content);

    expect(result.data.title).toBe("Hello World");
    expect(result.data.published).toBe(true);
    expect(result.data.date).toBeInstanceOf(Date);
    expect(result.body).toContain("# Hello World");
    expect(result.body).toContain("Some content here.");
  });

  it("should handle nested frontmatter", () => {
    const content = `---
title: Test
meta:
  priority: 1
  tags:
    - a
    - b
---

Body.`;

    const result = parseMdx(content);

    expect(result.data.meta).toEqual({ priority: 1, tags: ["a", "b"] });
  });

  it("should handle empty frontmatter", () => {
    const content = `---
---

Just body.`;

    const result = parseMdx(content);

    expect(result.data).toEqual({});
    expect(result.body).toBe("Just body.");
  });

  it("should handle content without frontmatter", () => {
    const content = "# No frontmatter here";

    const result = parseMdx(content);

    expect(result.data).toEqual({});
    expect(result.body).toBe("# No frontmatter here");
  });

  it("should trim body whitespace", () => {
    const content = `---
title: Test
---

  Body with spaces.

`;

    const result = parseMdx(content);

    expect(result.body).toBe("Body with spaces.");
  });
});
