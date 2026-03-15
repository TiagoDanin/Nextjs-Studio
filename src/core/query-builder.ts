/**
 * @context  Core layer — query builder at src/core/query-builder.ts
 * @does     Provides a fluent API to filter, sort, and paginate content entries from a collection
 * @depends  src/shared/types.ts, src/core/content-store.ts
 * @do       Add new query capabilities here (e.g. search, groupBy)
 * @dont     Import from CLI or UI; access the filesystem; perform I/O
 */

import { filter, orderBy, get, slice } from "lodash-es";
import type { QueryOptions } from "../shared/types.js";
import type { CollectionTypeMap } from "../shared/types.js";
import { getStore } from "./content-store.js";

/**
 * Fluent query builder for content collections.
 * Returned by `queryCollection()` — supports both chaining and direct array usage.
 *
 * ```ts
 * Fluent chaining
 * queryCollection("blog").where({ published: true }).sort("date", "desc").limit(10).all()
 *
 * Direct array usage — all native JS array methods work
 * queryCollection("blog").slice(0, 5)
 * queryCollection("blog").map(post => post.title)
 * ```
 */
export class QueryBuilder<T = Record<string, unknown>> {
  private readonly collectionName: string;
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

  all(): T[] {
    let entries = [...getStore().getCollection(this.collectionName)];

    if (this.options.where) {
      const conditions = this.options.where;
      entries = filter(entries, (entry) =>
        Object.entries(conditions).every(([key, value]) => get(entry.data, key) === value),
      );
    }

    if (this.options.sort) {
      const { field, order } = this.options.sort;
      entries = orderBy(entries, [(entry) => get(entry.data, field)], [order]);
    }

    const start = this.options.offset ?? 0;
    const end = this.options.limit ? start + this.options.limit : undefined;
    return slice(entries, start, end).map((e) => e.data as unknown as T);
  }

  first(): T | undefined {
    return this.limit(1).all()[0];
  }

  count(): number {
    return this.all().length;
  }
}

/** Intersection type: fluent builder + full native Array<T> interface. */
export type QueryResult<T> = QueryBuilder<T> & T[];

/**
 * Wraps a QueryBuilder in a Proxy that delegates any unknown property access
 * to the resolved array. The array result is cached and invalidated whenever
 * a fluent method (where/sort/limit/offset) is called.
 */
const FLUENT_METHODS = new Set(["where", "sort", "limit", "offset"]);

function wrapWithArrayProxy<T>(builder: QueryBuilder<T>): QueryResult<T> {
  let cache: T[] | null = null;

  return new Proxy(builder, {
    get(target, prop, receiver) {
      // Fluent methods: apply on target, invalidate cache, return proxy for chaining
      if (FLUENT_METHODS.has(String(prop))) {
        const method = Reflect.get(target, prop) as (...args: unknown[]) => unknown;
        return (...args: unknown[]) => {
          cache = null;
          method.apply(target, args);
          return receiver;
        };
      }

      // Own QueryBuilder methods (all, first, count, etc.)
      if (prop in target) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      }

      // Delegate everything else (slice, map, filter, length, etc.) to the resolved array
      if (!cache) cache = target.all();
      const value = Reflect.get(cache, prop);
      return typeof value === "function" ? value.bind(cache) : value;
    },
  }) as unknown as QueryResult<T>;
}

/**
 * Entry point for querying a content collection.
 */
export function queryCollection<K extends keyof CollectionTypeMap>(
  name: K,
): QueryResult<CollectionTypeMap[K]>;
export function queryCollection(name: string): QueryResult<Record<string, unknown>>;
export function queryCollection(name: string): QueryResult<Record<string, unknown>> {
  return wrapWithArrayProxy(new QueryBuilder(name));
}
