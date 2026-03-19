# Drafts

Entries can be marked as drafts to exclude them from production builds while still being visible in the studio editor.

## Marking an Entry as Draft

Add `draft: true` to the frontmatter (MDX) or JSON data:

```mdx
---
title: Work in Progress
draft: true
---

This post won't appear in production queries.
```

```json
{
  "title": "Unreleased Feature",
  "draft": true
}
```

## Querying Without Drafts

Use `.excludeDrafts()` in the query builder to filter out draft entries:

```ts
const published = queryCollection("blog")
  .excludeDrafts()
  .sort("date", "desc")
  .all();
```

Without `.excludeDrafts()`, all entries (including drafts) are returned.

## Studio UI Behavior

- Draft entries appear with **reduced opacity** in the sidebar and sheet views
- A "draft" label is shown next to draft entries in the sidebar
- Drafts are fully editable — the draft flag only affects query filtering

## API Reference

| Function | Description |
|----------|-------------|
| `isDraft(entry)` | Returns `true` if `entry.data.draft === true` |
| `filterDrafts(entries)` | Returns a new array with all drafts removed |
| `queryBuilder.excludeDrafts()` | Fluent method to exclude drafts from query results |
