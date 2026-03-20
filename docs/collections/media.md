# Media

Each collection stores its media files in a configurable location. By default, assets live alongside your content inside `contents/`. You can redirect uploads to the project's `public/` directory so Next.js serves them as static files.

## Default file location

```
contents/
└── blog/
    ├── hello-world.mdx
    └── media/
        ├── cover.png
        ├── demo.mp4
        └── podcast.mp3
```

There is no global media folder. Each collection manages its own assets independently.

## Saving media to `public/` (recommended for Next.js)

When your site exports as a static site, images must live under `public/` to be served correctly. Configure `mediaDir` per collection in `studio.config.ts`:

```ts
// studio.config.ts
const config: StudioConfig = {
  collections: {
    posts: {
      mediaDir: "public/images/posts",
    },
  },
};
```

With this setting:

- Uploads are saved to `<projectRoot>/public/images/posts/filename.jpg`
- The URL embedded in MDX is `/images/posts/filename.jpg` — works on both the consumer Next.js site and in the studio editor
- The studio serves these files internally via the fallback rewrite so the editor preview renders them correctly

### URL derivation

The public URL is derived by stripping the leading `public/` segment from `mediaDir`:

| `mediaDir` | URL in MDX |
|------------|------------|
| `public/images/posts` | `/images/posts/filename.jpg` |
| `public/assets/blog` | `/assets/blog/filename.jpg` |

## Adding files

### Drag and drop

Drop files directly onto the editor canvas. The file uploads and inserts at the cursor position automatically.

### Paste from clipboard

Copy an image (e.g. a screenshot) and paste with `Ctrl+V` / `Cmd+V`. The file uploads and embeds inline.

### Toolbar button

Click the image icon in the editor toolbar to open the media picker. Choose an existing file or upload a new one.

### Slash commands

Type `/` anywhere in the editor to open the command palette:

| Command | Picker filtered to |
|---------|--------------------|
| `/image` | Images only |
| `/video` | Videos only |
| `/audio` | Audio files only |

## Media picker

The picker shows all files already uploaded to the current collection.

- **Click** a file to select it
- **Double-click** to select and insert immediately
- **Drag and drop** new files onto the upload area, or click to browse
- Click **Insert** to embed the selected file

## How files are embedded

| File type | Embedded as |
|-----------|-------------|
| Image | Inline image — renders in the editor preview |
| Video | Inline video node |
| Audio | Inline audio node |
| Any other file | Clickable link with the filename as label |

## Supported types

| Category | Extensions |
|----------|-----------|
| Images | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.avif` |
| Videos | `.mp4` `.webm` `.ogv` |
| Audio | `.mp3` `.ogg` `.wav` `.m4a` `.aac` `.flac` |
| Other | Any file — uploaded and linked |

## File names

Filenames are sanitized on upload. Characters outside letters, numbers, dots, dashes, and underscores are replaced with `_`. Rename files before uploading if the original name matters.

## Using media in schemas

To add a media picker to a form field, use the `media` field type:

```ts
{ name: "cover", type: "media", accept: ["image/*"] }
```

See [Field Types](../reference/fields.md#media) for the full options reference.

## Next steps

- [Collections](./overview.md) — how collections and their media folders are organized
- [Field Types](../reference/fields.md) — use the `media` field type in your schema
