import type { CollectionSchema } from "../../src/core/index.js";

export const blogSchema: CollectionSchema = {
  collection: "blog",
  label: "Blog Posts",
  fields: [
    {
      name: "id",
      type: "id",
      generate: "nanoid",
    },
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      maxLength: 120,
    },
    {
      name: "slug",
      type: "slug",
      label: "Slug",
      from: "title",
    },
    {
      name: "excerpt",
      type: "long-text",
      label: "Excerpt",
      rows: 3,
      required: false,
    },
    {
      name: "coverImage",
      type: "media",
      label: "Cover Image",
      accept: ["image/*"],
    },
    {
      name: "status",
      type: "status",
      label: "Status",
      options: [
        { label: "Draft",     value: "draft",     color: "gray"   },
        { label: "In Review", value: "review",    color: "yellow" },
        { label: "Published", value: "published", color: "green"  },
      ],
      defaultValue: "draft",
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      options: [
        { label: "Technology", value: "tech"     },
        { label: "Design",     value: "design"   },
        { label: "Business",   value: "business" },
      ],
    },
    {
      name: "tags",
      type: "multi-select",
      label: "Tags",
      options: [
        { label: "TypeScript", value: "typescript" },
        { label: "React",      value: "react"      },
        { label: "Next.js",    value: "nextjs"     },
        { label: "CSS",        value: "css"        },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Published At",
      includeTime: true,
    },
    {
      name: "author",
      type: "relation",
      label: "Author",
      collection: "authors",
    },
    {
      name: "seo",
      type: "object",
      label: "SEO",
      fields: [
        { name: "metaTitle",       type: "text",      label: "Meta Title",       maxLength: 60              },
        { name: "metaDescription", type: "long-text", label: "Meta Description", rows: 2, required: false   },
        { name: "ogImage",         type: "media",     label: "OG Image",         accept: ["image/*"], required: false },
      ],
    },
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
