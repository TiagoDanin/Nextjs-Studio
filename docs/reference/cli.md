# CLI Reference

The studio is started via the `npx nextjs-studio` command.

## Usage

```bash
npx nextjs-studio [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-d, --dir <path>` | Path to the contents directory | `contents` |
| `-p, --port <number>` | Port for the studio server | `3030` |
| `--generate-types` | Generate TypeScript types and exit | — |
| `-V, --version` | Print version | — |
| `-h, --help` | Show help | — |

## Examples

```bash
# Start with defaults (./contents on port 3030)
npx nextjs-studio

# Custom contents directory
npx nextjs-studio --dir ./example/contents

# Custom port
npx nextjs-studio --port 4000

# Generate types
npx nextjs-studio --generate-types
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STUDIO_CONTENTS_DIR` | Contents directory (set automatically by CLI) |
| `STUDIO_CONFIG_PATH` | Absolute path to the resolved config file |
| `PORT` | Server port (set automatically by CLI) |

## Configuration

The CLI looks for a config file in the project root in this order:

1. `studio.config.ts`
2. `studio.config.js`
3. `studio.config.mjs`

See [Configuration](../getting-started/configuration.md) for config file format.

## Type Generation

`--generate-types` reads collection schemas from the config, indexes the contents directory, and writes a `.studio/studio.d.ts` file with typed interfaces. See [Type Generation](./type-generation.md) for details.
