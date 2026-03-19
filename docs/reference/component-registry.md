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
2. Choose from the registered components
3. The component is inserted as a placeholder block
4. Click the block to open the props panel on the right
5. Edit props using the field-based form

## MDX Output

Components are serialized as standard JSX in the MDX file:

```mdx
<Hero title="Welcome" subtitle="Get started" image="/media/hero.jpg" centered />
```

## API

| Function | Description |
|----------|-------------|
| `loadComponentRegistry(config)` | Extracts `ComponentDefinition[]` from config |
| `serializeComponentProps(props)` | Converts a props object to JSX attribute string |
