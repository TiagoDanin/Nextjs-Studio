import type { ContentEntry, QueryOptions } from "../shared/types.js";

/**
 * Query builder for content collections.
 *
 * Usage:
 * ```ts
 * const posts = queryCollection("blog")
 *   .where({ published: true })
 *   .sort("date", "desc")
 *   .limit(10)
 *   .all();
 * ```
 */
export class QueryBuilder {
  private collection: string;
  private options: QueryOptions = {};

  constructor(collection: string) {
    this.collection = collection;
  }

  where(conditions: Record<string, unknown>): this {
    this.options.where = { ...this.options.where, ...conditions };
    return this;
  }

  sort(field: string, order: "asc" | "desc" = "asc"): this {
    this.options.sort = { field, order };
    return this;
  }

  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  offset(count: number): this {
    this.options.offset = count;
    return this;
  }

  all(): ContentEntry[] {
    // TODO: implement with indexer integration
    return [];
  }

  first(): ContentEntry | undefined {
    return this.limit(1).all()[0];
  }

  count(): number {
    return this.all().length;
  }
}

/**
 * Entry point for querying a content collection.
 */
export function queryCollection(collection: string): QueryBuilder {
  return new QueryBuilder(collection);
}
