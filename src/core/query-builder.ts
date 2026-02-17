import { filter, orderBy, get, slice } from "lodash-es";
import type { ContentEntry, QueryOptions } from "../shared/types.js";
import { getStore } from "./content-store.js";

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
 *
 * Supports dot notation for nested properties:
 * ```ts
 * queryCollection("pages")
 *   .where({ "hero.title": "Welcome" })
 *   .sort("meta.priority", "desc")
 *   .all();
 * ```
 */
export class QueryBuilder {
  private collectionName: string;
  private options: QueryOptions = {};

  constructor(collection: string) {
    this.collectionName = collection;
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
    let entries = [...getStore().getCollection(this.collectionName)];

    if (this.options.where) {
      const conditions = this.options.where;
      entries = filter(entries, (entry) =>
        Object.entries(conditions).every(
          ([key, value]) => get(entry.data, key) === value,
        ),
      );
    }

    if (this.options.sort) {
      const { field, order } = this.options.sort;
      entries = orderBy(entries, [(entry) => get(entry.data, field)], [order]);
    }

    const start = this.options.offset ?? 0;
    const end = this.options.limit ? start + this.options.limit : undefined;
    entries = slice(entries, start, end);

    return entries;
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
