# Introduction

**Nextjs Studio** is a Git-based, local-first CMS for Next.js projects. It works with any Next.js setup, and with support for static export (`output: "export"`).

## What is Nextjs Studio?

Nextjs Studio is divided into two main parts:

### 1. Core — Build-time Content Engine

The core engine runs during your Next.js build process. It:

- Indexes the `/contents` directory
- Parses MDX files (frontmatter + body) and JSON files
- Validates content against Zod schemas
- Generates a content index cache
- Provides the `queryCollection()` API for fetching content in your pages

Your website remains **fully static**. The core has zero runtime dependencies — everything is resolved at build time.

### 2. CLI Server — Local CMS Interface

The CLI server is a standalone application that runs at `http://localhost:3030`. It provides:

- **MDX Visual Editor** — Rich text editing powered by TipTap with slash commands, drag & drop blocks, React component insertion, and frontmatter binding
- **JSON Sheet Editor** — Spreadsheet-style view for JSON arrays with inline editing, sorting, and validation
- **JSON Form Editor** — Auto-generated forms for JSON objects with nested object support and type-aware inputs
- **Media Library** — Browse and pick images/files from your project
- **Script Runner** — Execute import/sync scripts directly from the UI
- **File Watcher** — Live updates when files change on disk

The CLI server is completely independent from the Next.js runtime. It reads and writes files directly to your filesystem.

## How Content Works

Content lives in the `/contents` directory at your project root. Each folder becomes a **collection**:

```
contents/
├── blog/                       # "blog" collection (MDX)
│   ├── hello-world.mdx
│   └── getting-started.mdx
├── products/                   # "products" collection (JSON array)
│   └── index.json
└── settings/                   # "settings" collection (JSON object)
    └── index.json
```

### MDX Content

MDX files (`.mdx`) support frontmatter and rich content:

```mdx
---
title: Hello World
date: 2026-01-15
published: true
---

# Hello World

This is a blog post written in **MDX**.
```

### JSON Content

JSON files are handled based on their structure:

- **JSON Array** → Rendered as a spreadsheet/table view in the CMS
- **JSON Object** → Rendered as a form view in the CMS

## Next Steps

- [Installation](./installation.md) — Set up Nextjs Studio in your project
- [Configuration](./configuration.md) — Configure collections and scripts
