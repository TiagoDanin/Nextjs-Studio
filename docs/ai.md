# Using AI with Nextjs Studio

AI assistants (Claude, GitHub Copilot, ChatGPT) work exceptionally well with Nextjs Studio because everything is explicit and file-based: your schema is code, your content is plain text, and the query API is a simple fluent builder.

The more context you give the AI about your setup, the better the results.

## Give AI your schema

The single most useful thing you can do is share your `studio.config.ts` (or your schema files) at the start of a conversation. The AI will understand your field names, types, and collection structure, and produce correct code without guessing.

```
Here is my studio.config.ts:

[paste the full file]

Now write a Next.js page that lists all published blog posts sorted by date.
```

## Give AI your content structure

If you're asking about content queries or collections, show the folder layout:

```
My contents/ directory looks like this:

contents/
├── blog/          # MDX files with frontmatter (title, slug, published, date)
├── products/      # index.json with an array of { name, price, inStock }
└── settings/      # index.json with a single object { siteName, description }

Write a queryCollection() call that returns the 5 most recent published posts.
```

## Example prompts

### Querying content

```
Using the queryCollection API from nextjs-studio, write a function that:
- fetches all blog posts where published is true
- sorts them by date descending
- paginates with 10 items per page
- accepts a page number as a parameter
```

```
Write a Next.js App Router page at app/blog/[slug]/page.tsx that:
- uses queryCollection("blog").where({ slug: params.slug }).first()
- calls notFound() if the post doesn't exist
- renders post.data.title and post.body
```

### Defining schemas

```
Write a CollectionSchema for a "team" collection with these fields:
- name (text, required)
- role (text)
- bio (long-text, optional)
- photo (media, images only)
- linkedin (url, optional)
- order (number, integer)
```

```
Add an "seo" object field to my existing blog schema. It should have:
- metaTitle (text, max 60 chars)
- metaDescription (long-text, optional)
- ogImage (media, images only, optional)
```

### Writing import scripts

```
Write a Node.js import script for nextjs-studio that:
- fetches products from https://api.example.com/products
- maps the response to { name, price, inStock, slug }
- outputs valid JSON to stdout
- exits with code 1 and logs to stderr on failure
```

### MDX content

```
Write an MDX file for a blog post about TypeScript generics. Include:
- frontmatter with title, date (today), published: true, tags: [typescript]
- a short intro paragraph
- 3 code examples with explanation
```

## Tips

**Paste the field types reference.** The full list of field types is in `docs/reference/fields.md`. Paste it when asking the AI to design a schema — it will pick the right types instead of inventing ones.

**Tell the AI the collection type.** "This is a JSON array collection" or "this is an MDX collection" helps the AI understand how the data is structured and what the CMS view looks like.

**Share the ContentEntry interface.** When asking the AI to write query code, paste this so it knows what `.all()` returns:

```ts
interface ContentEntry {
  collection: string;
  slug: string;
  path: string;
  body?: string;                 // only for MDX collections
  data: Record<string, unknown>; // frontmatter or JSON data
}
```

**Use `InferSchemaData` for typed code.** Ask the AI to use it:

```
Use InferSchemaData<typeof blogSchema> to type the result of queryCollection("blog").all().
```

**Import scripts must write to stdout.** When asking the AI to write an import script, remind it that the CLI captures stdout — not a file write. All output must go through `console.log(JSON.stringify(...))`.

## With Claude Code

If you use Claude Code, the project's `CLAUDE.md` file gives Claude the full context about the codebase automatically. No need to paste context manually — just start editing.

You can also ask Claude to generate type definitions after updating your schema:

```
Run `npx nextjs-studio --generate-types` and show me the generated types.
```
