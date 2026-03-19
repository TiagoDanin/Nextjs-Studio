# JSON Editing

The studio provides two views for JSON content: **Sheet** (table) for arrays and **Form** for objects.

## JSON Array → Sheet View

JSON files containing arrays render as a spreadsheet:

```json
[
  { "name": "Product A", "price": 29.99, "active": true },
  { "name": "Product B", "price": 49.99, "active": false }
]
```

### Features

- Sortable columns with type-aware display
- Row inspector sidebar for detailed editing
- Add/delete rows
- Draft badges on rows with `draft: true`
- Rich text editor for long text fields (>200 chars or containing newlines)
- Truncated cell display for long values

## JSON Object → Form View

JSON files containing a single object render as a sectioned form:

```json
{
  "title": "Site Settings",
  "description": "A long description...",
  "social": {
    "twitter": "@handle",
    "github": "user"
  }
}
```

### Features

- Auto-sectioned layout (flat fields + nested object sections)
- Collapsible sections with reorder controls
- Rich text editor for the primary long-text field
- Recursive tree editor for deeply nested objects
- Add field / add section buttons
- Field type detection (boolean, number, date, email, URL, select, etc.)

## Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S` — Save
