/**
 * @context  Shared layer — component types at src/shared/component-types.ts
 * @does     Defines the ComponentDefinition interface used by the component registry
 * @depends  src/shared/fields.ts
 * @do       Add new component descriptor fields here
 * @dont     Import React or runtime code — these are schema-only descriptors
 */

import type { FieldDefinition } from "./fields.js";

export interface ComponentDefinition {
  /** Unique component name, e.g. "Hero", "CallToAction" */
  name: string;
  /** Human-readable description */
  description?: string;
  /** MDX tag name, e.g. "Hero" maps to <Hero /> */
  tagName: string;
  /** Props schema using the existing FieldDefinition system */
  props: FieldDefinition[];
  /** Optional category for grouping in the UI */
  category?: string;
  /** Whether this is a block-level or inline component */
  inline?: boolean;
}
