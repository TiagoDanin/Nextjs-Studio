import type { CollectionSchema } from "../../src/core/index.js";

export const testsSchema: CollectionSchema = {
  collection: "tests",
  label: "Tests — All Fields",
  fields: [
    // --- Identity fields ---
    {
      name: "id",
      type: "id",
      label: "ID",
      generate: "nanoid",
    },
    {
      name: "slug",
      type: "slug",
      label: "Slug",
      from: "title",
    },

    // --- Scalar text fields ---
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      maxLength: 120,
      placeholder: "Enter title…",
    },
    {
      name: "excerpt",
      type: "long-text",
      label: "Excerpt",
      rows: 4,
      placeholder: "Short description…",
    },

    // --- Numeric fields ---
    {
      name: "number",
      type: "number",
      label: "Integer Number",
      format: "integer",
      min: 0,
      max: 9999,
      step: 1,
    },
    {
      name: "decimal",
      type: "number",
      label: "Decimal Number",
      format: "decimal",
      min: 0,
      max: 100,
      step: 0.01,
    },

    // --- Boolean ---
    {
      name: "boolean",
      type: "boolean",
      label: "Boolean Toggle",
      defaultValue: false,
    },

    // --- Date fields ---
    {
      name: "date",
      type: "date",
      label: "Date Only",
    },
    {
      name: "dateTime",
      type: "date",
      label: "DateTime",
      includeTime: true,
    },
    {
      name: "monthYear",
      type: "date",
      label: "Month/Year",
      includeDay: false,
    },
    {
      name: "yearOnly",
      type: "date",
      label: "Year Only",
      includeDay: false,
      includeMonth: false,
    },

    // --- Contact fields ---
    {
      name: "email",
      type: "email",
      label: "Email",
      placeholder: "user@example.com",
    },
    {
      name: "url",
      type: "url",
      label: "URL",
      placeholder: "https://example.com",
    },

    // --- Media ---
    {
      name: "coverImage",
      type: "media",
      label: "Cover Image",
      accept: ["image/*"],
    },
    {
      name: "attachment",
      type: "media",
      label: "Attachment (any file)",
      accept: ["image/*", "application/pdf", "video/*"],
    },

    // --- Select fields ---
    {
      name: "select",
      type: "select",
      label: "Single Select (Category)",
      options: [
        { label: "Technology", value: "tech"     },
        { label: "Design",     value: "design"   },
        { label: "Business",   value: "business" },
      ],
      defaultValue: "tech",
    },
    {
      name: "multiSelect",
      type: "multi-select",
      label: "Multi Select (Tags)",
      options: [
        { label: "TypeScript", value: "typescript" },
        { label: "React",      value: "react"      },
        { label: "Next.js",    value: "nextjs"     },
        { label: "CSS",        value: "css"        },
        { label: "Node.js",    value: "nodejs"     },
      ],
      defaultValue: ["react"],
    },

    // --- Status ---
    {
      name: "status",
      type: "status",
      label: "Status",
      options: [
        { label: "Draft",     value: "draft",     color: "gray"   },
        { label: "In Review", value: "review",    color: "yellow" },
        { label: "Published", value: "published", color: "green"  },
        { label: "Archived",  value: "archived",  color: "red"    },
      ],
      defaultValue: "draft",
    },

    // --- Relation ---
    {
      name: "author",
      type: "relation",
      label: "Author",
      collection: "authors",
      multiple: false,
    },

    // --- Formula (read-only computed) ---
    {
      name: "formula",
      type: "formula",
      label: "Formula (computed)",
      expression: "title + ' — ' + status",
      resultType: "string",
    },

    // --- Object (nested form) ---
    {
      name: "seo",
      type: "object",
      label: "SEO",
      fields: [
        {
          name: "metaTitle",
          type: "text",
          label: "Meta Title",
          maxLength: 60,
          placeholder: "SEO title…",
        },
        {
          name: "metaDescription",
          type: "long-text",
          label: "Meta Description",
          rows: 2,
          placeholder: "SEO description…",
        },
        {
          name: "ogImage",
          type: "media",
          label: "OG Image",
          accept: ["image/*"],
        },
      ],
    },

    // --- Array (table of items) ---
    {
      name: "links",
      type: "array",
      label: "Links",
      itemFields: [
        { name: "label", type: "text",  label: "Label"                           },
        { name: "url",   type: "url",   label: "URL",   placeholder: "https://…" },
        {
          name: "type",
          type: "select",
          label: "Type",
          options: [
            { label: "External", value: "external" },
            { label: "Internal", value: "internal" },
          ],
        },
      ],
    },

    // --- Timestamps (auto) ---
    {
      name: "createdAt",
      type: "created-time",
      label: "Created At",
    },
    {
      name: "updatedAt",
      type: "updated-time",
      label: "Updated At",
    },
  ],
};
