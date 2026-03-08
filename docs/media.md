# Media

Each collection has its own media folder where you store images, videos, audio files, and any other assets. Files are kept alongside your content and committed to your repository like everything else.

## Where Files Are Stored

Media assets live inside a `media/` subfolder within each collection:

```
contents/
└── blog/
    ├── hello-world.mdx
    ├── getting-started.mdx
    └── media/
        ├── cover.png
        ├── intro-video.mp4
        └── podcast-episode.mp3
```

There is no global media folder. Each collection manages its own assets.

## Adding Files

### Drag & Drop

Drop one or more files directly onto the editor canvas. The file is uploaded and inserted at the cursor position automatically.

### Paste from Clipboard

Copy an image (e.g. a screenshot) and paste it with `Ctrl+V` / `Cmd+V`. The file is uploaded and embedded inline.

### Toolbar Button

Click the image icon in the editor toolbar. The media picker opens and lets you choose an existing file or upload a new one.

### Slash Commands

Type `/` anywhere in the editor to open the command palette:

| Command | Opens picker filtered to |
|---------|--------------------------|
| `/image` | Images only |
| `/video` | Videos only |
| `/audio` | Audio files only |

## Media Picker

When you open the media picker, you see all the files already uploaded to the current collection. From there you can:

- **Click** a file to select it
- **Double-click** to select and insert immediately
- **Drag and drop** new files onto the upload area, or click it to browse
- Hit **Insert** to embed the selected file

The picker accepts any file type for upload.

## How Files Are Embedded

After selecting a file, the studio inserts it into the document:

| File type | How it's embedded |
|-----------|-------------------|
| Image | Inline image — renders in the editor preview |
| Video | Same as image — rendered by your site's MDX setup |
| Audio | Same as image — rendered by your site's MDX setup |
| Any other file | A clickable link with the filename as the label |

## Supported Types

| Category | Extensions |
|----------|-----------|
| Images | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.avif` |
| Videos | `.mp4` `.webm` `.ogv` |
| Audio | `.mp3` `.ogg` `.wav` `.m4a` `.aac` `.flac` |
| Other | Any file — uploaded and inserted as a link |

## File Names

Uploaded files are sanitized automatically. Characters outside letters, numbers, dots, dashes and underscores are replaced with `_`. Rename your files before uploading if the original name matters.

## Next Steps

- [Configuration](./getting-started/configuration.md) — Configure collections and import scripts
- [Field Types](./fields.md) — Use the `media` field type to attach files to structured content
