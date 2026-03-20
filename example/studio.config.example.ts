/**
 * Example studio.config.ts
 *
 * Copy this file to your project root as `studio.config.ts` and
 * adjust collections/fields to match your content structure.
 */

import type { StudioConfig } from "../src/core/index.js";
import type { ComponentDefinition } from "../src/shared/component-types.js";
import { blogSchema } from "./schemas/blog.js";
import { authorsSchema } from "./schemas/authors.js";

const config: StudioConfig & { components?: ComponentDefinition[] } = {
  collections: {
    blog: {
      schema: blogSchema,
      scripts: {
        sync: "node scripts/sync-posts.js",
      },
    },
    authors: {
      schema: authorsSchema,
    },
  },
  components: [
    {
      name: "Call to Action",
      tagName: "CTA",
      description: "A call-to-action button with title and link",
      category: "Marketing",
      props: [
        { name: "title", type: "text", required: true },
        { name: "href", type: "url", required: true },
        { name: "variant", type: "select", options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ]},
      ],
    },
    {
      name: "Hero",
      tagName: "Hero",
      description: "Full-width hero section",
      category: "Layout",
      props: [
        { name: "title", type: "text", required: true },
        { name: "subtitle", type: "text" },
        { name: "image", type: "media", accept: ["image/*"] },
        { name: "centered", type: "boolean", defaultValue: true },
      ],
    },
  ],
};

export default config;
