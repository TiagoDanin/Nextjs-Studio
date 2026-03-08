import { describe, it, expect } from "vitest";
import {
  generateInterfaceForSchema,
  generateCollectionTypes,
} from "../src/core/type-generator.js";
import type { CollectionSchema } from "../src/shared/fields.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const blogSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "slug", from: "title" },
    { name: "published", type: "boolean" },
    { name: "date", type: "date" },
    { name: "publishedAt", type: "date", includeTime: true },
    {
      name: "category",
      type: "select",
      options: [
        { label: "Tech", value: "tech" },
        { label: "Life", value: "life" },
      ],
    },
    {
      name: "tags",
      type: "multi-select",
      options: [{ label: "TS", value: "ts" }],
    },
    { name: "coverImage", type: "media" },
    { name: "authorEmail", type: "email" },
    { name: "website", type: "url" },
    { name: "id", type: "id", generate: "nanoid" },
    { name: "views", type: "number", format: "integer" },
    { name: "createdAt", type: "created-time" },
    { name: "updatedAt", type: "updated-time" },
  ],
} satisfies CollectionSchema;

const authorSchema = {
  collection: "author",
  fields: [
    { name: "name", type: "text" },
    { name: "email", type: "email" },
    {
      name: "social",
      type: "object",
      fields: [
        { name: "twitter", type: "url", required: false },
        { name: "github", type: "url", required: false },
      ],
    },
    {
      name: "posts",
      type: "relation",
      collection: "blog",
      multiple: true,
    },
  ],
} satisfies CollectionSchema;

// ---------------------------------------------------------------------------
// generateInterfaceForSchema
// ---------------------------------------------------------------------------

describe("generateInterfaceForSchema", () => {
  it("generates an interface with the correct name", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("export interface BlogEntry");
  });

  it("uses schema label in the JSDoc comment", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain('"Blog Posts"');
  });

  it("falls back to collection name in JSDoc when no label", () => {
    const output = generateInterfaceForSchema(authorSchema);
    expect(output).toContain('"author"');
  });

  it("emits string for text fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("title: string;");
  });

  it("emits Slug for slug fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("slug: Slug;");
  });

  it("emits boolean for boolean fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("published: boolean;");
  });

  it("emits ISODate for date without includeTime", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("date: ISODate;");
  });

  it("emits Date for date with includeTime: true", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("publishedAt: Date;");
  });

  it("emits a literal union for select options", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain('category: "tech" | "life";');
  });

  it("emits Array<literal union> for multi-select", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain('tags: Array<"ts">;');
  });

  it("emits MediaPath for media fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("coverImage: MediaPath;");
  });

  it("emits Email for email fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("authorEmail: Email;");
  });

  it("emits HttpUrl for url fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("website: HttpUrl;");
  });

  it("emits ID for id fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("id: ID;");
  });

  it("emits number for number fields", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("views: number;");
  });

  it("emits Date for created-time and updated-time", () => {
    const output = generateInterfaceForSchema(blogSchema);
    expect(output).toContain("createdAt: Date;");
    expect(output).toContain("updatedAt: Date;");
  });

  it("emits an inline object type for object fields", () => {
    const output = generateInterfaceForSchema(authorSchema);
    expect(output).toContain("social: {");
    expect(output).toContain("twitter?: HttpUrl;");
    expect(output).toContain("github?: HttpUrl;");
  });

  it("marks required:false fields as optional with ?", () => {
    const schema = {
      collection: "post",
      fields: [
        { name: "title", type: "text" },
        { name: "subtitle", type: "text", required: false },
      ],
    } satisfies CollectionSchema;
    const output = generateInterfaceForSchema(schema);
    expect(output).toContain("title: string;");
    expect(output).toContain("subtitle?: string;");
  });

  it("emits ID | ID[] for relation fields", () => {
    const output = generateInterfaceForSchema(authorSchema);
    expect(output).toContain("posts: ID[];");
  });

  it("emits pascal-case name for hyphenated collection names", () => {
    const schema = {
      collection: "case-study",
      fields: [{ name: "title", type: "text" }],
    } satisfies CollectionSchema;
    const output = generateInterfaceForSchema(schema);
    expect(output).toContain("export interface CaseStudyEntry");
  });
});

// ---------------------------------------------------------------------------
// generateCollectionTypes
// ---------------------------------------------------------------------------

describe("generateCollectionTypes", () => {
  it("includes the auto-generated banner", () => {
    const output = generateCollectionTypes([blogSchema]);
    expect(output).toContain("auto-generated by nextjs-studio");
  });

  it("includes branded type declarations", () => {
    const output = generateCollectionTypes([blogSchema]);
    expect(output).toContain("export type Email");
    expect(output).toContain("export type HttpUrl");
    expect(output).toContain("export type ISODate");
    expect(output).toContain("export type MediaPath");
    expect(output).toContain("export type ID");
    expect(output).toContain("export type Slug");
  });

  it("includes all schema interfaces", () => {
    const output = generateCollectionTypes([blogSchema, authorSchema]);
    expect(output).toContain("export interface BlogEntry");
    expect(output).toContain("export interface AuthorEntry");
  });

  it("includes a CollectionTypeMap with all collections", () => {
    const output = generateCollectionTypes([blogSchema, authorSchema]);
    expect(output).toContain("export interface CollectionTypeMap");
    expect(output).toContain('"blog": BlogEntry');
    expect(output).toContain('"author": AuthorEntry');
  });

  it("returns an empty CollectionTypeMap for an empty array", () => {
    const output = generateCollectionTypes([]);
    expect(output).toContain("export interface CollectionTypeMap {");
  });
});
