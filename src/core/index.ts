/**
 * @context  Core layer — public API barrel at src/core/index.ts
 * @does     Re-exports the public surface of the core content engine for consumer use
 * @depends  src/core/*, src/shared/*
 * @do       Add new public exports here when extending the core API
 * @dont     Contain logic; import from CLI or UI
 */

export { queryCollection } from "./query-builder.js";
export type { QueryResult } from "./query-builder.js";
export { loadContent, loadContentSync } from "./content-store.js";
export { ContentIndex } from "./indexer.js";
export { loadStudioConfig, resolveConfigPath, loadConfigFromPath } from "./config-loader.js";
export { isDraft, filterDrafts } from "./draft-filter.js";
export { bindFrontmatter, extractFrontmatterTokens } from "./frontmatter-binder.js";
export { parseLocaleFromFilename, stripLocaleFromSlug } from "./locale-parser.js";

export type {
  ContentEntry,
  Collection,
  CollectionTypeMap,
  StudioConfig,
  CollectionConfig,
  QueryOptions,
} from "../shared/types.js";

export type {
  CollectionSchema,
  FieldDefinition,
  FieldType,
} from "../shared/fields.js";

export type { InferSchemaData, InferFieldValue } from "../shared/schema-types.js";

export { fieldLabel, keyLabel } from "../shared/field-utils.js";
