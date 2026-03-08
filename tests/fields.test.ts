import { describe, it, expect } from "vitest";
import { expectTypeOf } from "vitest";
import type {
  FieldDefinition,
  CollectionSchema,
  InferFieldValue,
  InferSchemaData,
  Email,
  HttpUrl,
  ISODate,
  MediaPath,
  ID,
  Slug,
} from "../src/shared/fields.js";

// ---------------------------------------------------------------------------
// Runtime shape tests — every field object must be valid FieldDefinition
// ---------------------------------------------------------------------------

describe("FieldDefinition runtime shapes", () => {
  it("accepts a text field", () => {
    const f = { name: "title", type: "text" } satisfies FieldDefinition;
    expect(f.type).toBe("text");
  });

  it("accepts a long-text field", () => {
    const f = {
      name: "bio",
      type: "long-text",
      rows: 6,
    } satisfies FieldDefinition;
    expect(f.rows).toBe(6);
  });

  it("accepts a number field with format", () => {
    const f = {
      name: "views",
      type: "number",
      format: "integer",
      min: 0,
    } satisfies FieldDefinition;
    expect(f.format).toBe("integer");
  });

  it("accepts a boolean field", () => {
    const f = {
      name: "published",
      type: "boolean",
      defaultValue: false,
    } satisfies FieldDefinition;
    expect(f.defaultValue).toBe(false);
  });

  it("accepts a date field without time", () => {
    const f = { name: "createdAt", type: "date" } satisfies FieldDefinition;
    expect(f.includeTime).toBeUndefined();
  });

  it("accepts a date field with includeTime", () => {
    const f = {
      name: "publishedAt",
      type: "date",
      includeTime: true,
    } satisfies FieldDefinition;
    expect(f.includeTime).toBe(true);
  });

  it("accepts a select field with options", () => {
    const f = {
      name: "category",
      type: "select",
      options: [
        { label: "Tech", value: "tech" },
        { label: "Life", value: "life" },
      ],
    } satisfies FieldDefinition;
    expect(f.options).toHaveLength(2);
  });

  it("accepts a multi-select field", () => {
    const f = {
      name: "tags",
      type: "multi-select",
      options: [{ label: "TS", value: "ts" }],
    } satisfies FieldDefinition;
    expect(f.type).toBe("multi-select");
  });

  it("accepts url, email, media fields", () => {
    const url = { name: "website", type: "url" } satisfies FieldDefinition;
    const email = { name: "contact", type: "email" } satisfies FieldDefinition;
    const media = {
      name: "cover",
      type: "media",
      accept: ["image/*"],
    } satisfies FieldDefinition;
    expect(url.type).toBe("url");
    expect(email.type).toBe("email");
    expect(media.accept).toEqual(["image/*"]);
  });

  it("accepts an object field with nested fields", () => {
    const f = {
      name: "author",
      type: "object",
      fields: [
        { name: "name", type: "text" },
        { name: "email", type: "email" },
      ],
    } satisfies FieldDefinition;
    expect(f.fields).toHaveLength(2);
  });

  it("accepts an array field with itemFields", () => {
    const f = {
      name: "links",
      type: "array",
      itemFields: [
        { name: "label", type: "text" },
        { name: "url", type: "url" },
      ],
    } satisfies FieldDefinition;
    expect(f.itemFields).toHaveLength(2);
  });

  it("accepts id and slug fields", () => {
    const id = {
      name: "id",
      type: "id",
      generate: "nanoid",
    } satisfies FieldDefinition;
    const slug = {
      name: "slug",
      type: "slug",
      from: "title",
    } satisfies FieldDefinition;
    expect(id.generate).toBe("nanoid");
    expect(slug.from).toBe("title");
  });

  it("accepts a relation field", () => {
    const f = {
      name: "authorId",
      type: "relation",
      collection: "authors",
      multiple: false,
    } satisfies FieldDefinition;
    expect(f.collection).toBe("authors");
  });

  it("accepts a status field", () => {
    const f = {
      name: "status",
      type: "status",
      options: [
        { label: "Draft", value: "draft", color: "gray" },
        { label: "Published", value: "published", color: "green" },
      ],
      defaultValue: "draft",
    } satisfies FieldDefinition;
    expect(f.options[0].color).toBe("gray");
  });

  it("accepts created-time and updated-time fields", () => {
    const ct = {
      name: "createdAt",
      type: "created-time",
    } satisfies FieldDefinition;
    const ut = {
      name: "updatedAt",
      type: "updated-time",
    } satisfies FieldDefinition;
    expect(ct.type).toBe("created-time");
    expect(ut.type).toBe("updated-time");
  });
});

// ---------------------------------------------------------------------------
// Type-level tests — InferFieldValue resolves to the correct TS types
// ---------------------------------------------------------------------------

describe("InferFieldValue type inference", () => {
  it("text → string", () => {
    type F = { name: "title"; type: "text" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<string>();
  });

  it("long-text → string", () => {
    type F = { name: "bio"; type: "long-text" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<string>();
  });

  it("number → number", () => {
    type F = { name: "views"; type: "number"; format: "integer" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<number>();
  });

  it("boolean → boolean", () => {
    type F = { name: "published"; type: "boolean" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<boolean>();
  });

  it("date without includeTime → ISODate", () => {
    type F = { name: "date"; type: "date" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<ISODate>();
  });

  it("date with includeTime: true → Date", () => {
    type F = { name: "publishedAt"; type: "date"; includeTime: true };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Date>();
  });

  it("select → literal union of option values", () => {
    type F = {
      name: "category";
      type: "select";
      options: [{ label: "Tech"; value: "tech" }, { label: "Life"; value: "life" }];
    };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<"tech" | "life">();
  });

  it("multi-select → Array of literal union", () => {
    type F = {
      name: "tags";
      type: "multi-select";
      options: [{ label: "TS"; value: "ts" }, { label: "JS"; value: "js" }];
    };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Array<"ts" | "js">>();
  });

  it("url → HttpUrl", () => {
    type F = { name: "website"; type: "url" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<HttpUrl>();
  });

  it("email → Email", () => {
    type F = { name: "contact"; type: "email" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Email>();
  });

  it("media → MediaPath", () => {
    type F = { name: "cover"; type: "media" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<MediaPath>();
  });

  it("id → ID", () => {
    type F = { name: "id"; type: "id" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<ID>();
  });

  it("slug → Slug", () => {
    type F = { name: "slug"; type: "slug"; from: "title" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Slug>();
  });

  it("relation single → ID", () => {
    type F = { name: "authorId"; type: "relation"; collection: "authors" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<ID>();
  });

  it("relation multiple → ID[]", () => {
    type F = {
      name: "tagIds";
      type: "relation";
      collection: "tags";
      multiple: true;
    };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<ID[]>();
  });

  it("created-time → Date", () => {
    type F = { name: "createdAt"; type: "created-time" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Date>();
  });

  it("updated-time → Date", () => {
    type F = { name: "updatedAt"; type: "updated-time" };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<Date>();
  });

  it("formula with resultType number → number", () => {
    type F = {
      name: "total";
      type: "formula";
      expression: "price * qty";
      resultType: "number";
    };
    expectTypeOf<InferFieldValue<F>>().toEqualTypeOf<number>();
  });
});

// ---------------------------------------------------------------------------
// InferSchemaData — full schema inference
// ---------------------------------------------------------------------------

describe("InferSchemaData", () => {
  it("infers a complete schema correctly", () => {
    type S = {
      collection: "blog";
      fields: [
        { name: "title"; type: "text" },
        { name: "slug"; type: "slug"; from: "title" },
        { name: "published"; type: "boolean" },
        { name: "date"; type: "date" },
        {
          name: "category";
          type: "select";
          options: [{ label: "Tech"; value: "tech" }];
        },
      ];
    };

    type Data = InferSchemaData<S>;

    expectTypeOf<Data["title"]>().toEqualTypeOf<string>();
    expectTypeOf<Data["slug"]>().toEqualTypeOf<Slug>();
    expectTypeOf<Data["published"]>().toEqualTypeOf<boolean>();
    expectTypeOf<Data["date"]>().toEqualTypeOf<ISODate>();
    expectTypeOf<Data["category"]>().toEqualTypeOf<"tech">();
  });

  it("marks required:false fields as optional", () => {
    type S = {
      collection: "post";
      fields: [
        { name: "title"; type: "text" },
        { name: "subtitle"; type: "text"; required: false },
      ];
    };

    type Data = InferSchemaData<S>;

    expectTypeOf<Data["title"]>().toEqualTypeOf<string>();
    expectTypeOf<Data["subtitle"]>().toEqualTypeOf<string | undefined>();
  });
});
