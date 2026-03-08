/**
 * @context  Core layer — parsers barrel at src/core/parsers/index.ts
 * @does     Re-exports all parser modules for convenient single-import access
 * @depends  src/core/parsers/parser-mdx.ts, src/core/parsers/parser-json.ts
 * @do       Add new parser exports here as new file types are supported
 * @dont     Contain parsing logic; import from CLI or UI
 */

export { parseMdx, serializeMdx, type ParsedMdx } from "./parser-mdx.js";
export {
  parseJson,
  type ParsedJson,
  type ParsedJsonArray,
  type ParsedJsonObject,
} from "./parser-json.js";
