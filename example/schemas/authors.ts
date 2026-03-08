import type { CollectionSchema } from "../../src/core/index.js";

export const authorsSchema: CollectionSchema = {
  collection: "authors",
  label: "Authors",
  fields: [
    { name: "id",     type: "id",        generate: "nanoid"                        },
    { name: "name",   type: "text",      label: "Name",   required: true           },
    { name: "email",  type: "email",     label: "Email"                            },
    { name: "bio",    type: "long-text", label: "Bio",    rows: 4, required: false },
    {
      name: "avatar",
      type: "media",
      label: "Avatar",
      accept: ["image/*"],
      required: false,
    },
    {
      name: "links",
      type: "array",
      label: "Links",
      itemFields: [
        { name: "label", type: "text", label: "Label" },
        { name: "url",   type: "url",  label: "URL"   },
      ],
    },
  ],
};
