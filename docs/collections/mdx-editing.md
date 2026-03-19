# MDX Editing

The studio provides a rich text editor for `.mdx` files based on TipTap.

## Features

- **Rich text toolbar** — headings, bold, italic, strikethrough, code, links
- **Slash commands** — type `/` to insert blocks (headings, lists, code blocks, images, videos, mermaid diagrams, components)
- **Frontmatter editor** — inline key-value editor for YAML frontmatter
- **Media integration** — drag & drop images, or use the media picker
- **Mermaid diagrams** — insert flowcharts and sequence diagrams with live preview
- **Code blocks** — syntax-highlighted code with language detection
- **Preview** — HTML preview dialog for the rendered content
- **Frontmatter binding** — `{frontmatter.title}` tokens in body are highlighted and can be resolved at build time

## File Structure

Each MDX entry is a file inside a collection folder:

```
contents/
  blog/
    hello-world.mdx
    getting-started.mdx
```

## Frontmatter

Frontmatter is parsed with `gray-matter` and displayed as an editable form above the editor body:

```mdx
---
title: Hello World
date: 2026-01-15
published: true
---

Content goes here...
```

## i18n

Locale variants use filename-based convention:

```
contents/blog/
  hello-world.mdx       # default locale
  hello-world.pt.mdx    # Portuguese
  hello-world.es.mdx    # Spanish
```

Use `queryCollection("blog").locale("pt").all()` to query by locale.

## Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S` — Save
- `/` — Open slash command menu
