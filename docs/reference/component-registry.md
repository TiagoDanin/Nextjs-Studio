# Component Registry

The component registry lets you define custom MDX components that editors can insert via the slash command menu. Components are schema-only descriptors — no React imports are needed in the config.

## Defining Components

Add a `components` array to `studio.config.ts`:

```ts
// studio.config.ts
export default {
  components: [
    {
      name: "Hero",
      tagName: "Hero",
      description: "Full-width hero section",
      category: "Layout",
      props: [
        { name: "title", type: "text", required: true },
        { name: "subtitle", type: "long-text" },
        { name: "image", type: "media", accept: ["image/*"] },
        { name: "centered", type: "boolean", defaultValue: true },
      ],
    },
    {
      name: "Call To Action",
      tagName: "CTA",
      category: "Marketing",
      inline: true,
      props: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "url" },
      ],
    },
  ],
};
```

## ComponentDefinition Interface

```ts
interface ComponentDefinition {
  name: string;           // Display name, e.g. "Hero"
  tagName: string;        // MDX tag, e.g. "Hero" → <Hero />
  description?: string;   // Shown in the slash command menu
  props: FieldDefinition[]; // Uses the same field system as schemas
  category?: string;      // For grouping in the UI
  inline?: boolean;       // Block-level (default) or inline
}
```

## Editor Integration

1. Type `/` in the MDX editor and select "Component"
2. A component block is inserted as a dashed placeholder showing `<Component />`
3. Click the block to open the props panel on the right side
4. Edit props using the field-based form (text, boolean, select, url, etc.)
5. When saved, the component is serialized as standard JSX in the MDX file

### Existing components in MDX files

When you open an MDX file that already contains JSX components (e.g. `<YouTubeEmbed videoId="abc" title="..." />`), the editor automatically parses them into component blocks. Click any block to edit its props in the side panel — no registry entry is required. If the component **is** in the registry, the panel shows typed fields; otherwise it shows the existing props as free-form inputs.

## Example

Given this config:

```ts
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
      ]},
    ],
  },
],
```

After editing the props in the panel, the MDX output will be:

```mdx
<CTA title="Start Building" href="/docs" variant="primary" />
```

See `example/studio.config.ts` and `example/contents/blog/getting-started.mdx` for a working example.

## MDX Output

Components are serialized as standard JSX in the MDX file:

```mdx
<Hero title="Welcome" subtitle="Get started" image="/media/hero.jpg" centered />
```

Props are serialized as:
- Strings: `key="value"`
- Booleans: `key` (true) or omitted (false)
- Numbers/Objects: `key={value}`

## API

| Function | Description |
|----------|-------------|
| `loadComponentRegistry(config)` | Extracts `ComponentDefinition[]` from config |
| `serializeComponentProps(props)` | Converts a props object to JSX attribute string |
