/**
 * @context  Core layer — component registry at src/core/component-registry.ts
 * @does     Loads component definitions from studio.config.ts for use in the MDX editor
 * @depends  src/shared/component-types.ts, src/shared/types.ts
 * @do       Add component validation or transformation logic here
 * @dont     Import React or render components — the CMS only edits props
 */

import type { StudioConfig } from "../shared/types.js";
import type { ComponentDefinition } from "../shared/component-types.js";

/**
 * Extracts component definitions from the studio config.
 * Components are defined in `studio.config.ts` under `components` key.
 */
export function loadComponentRegistry(config: StudioConfig): ComponentDefinition[] {
  const components = (config as StudioConfig & { components?: ComponentDefinition[] }).components;
  if (!Array.isArray(components)) return [];
  return components.filter(isValidComponent);
}

function isValidComponent(def: unknown): def is ComponentDefinition {
  if (typeof def !== "object" || def === null) return false;
  const obj = def as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    typeof obj.tagName === "string" &&
    Array.isArray(obj.props)
  );
}

/**
 * Serializes component props to MDX JSX attributes string.
 */
export function serializeComponentProps(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}="${value}"`;
      if (typeof value === "boolean") return value ? key : "";
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(" ");
}
