/**
 * @context  Core layer — locale parser at src/core/locale-parser.ts
 * @does     Extracts locale codes from filenames using the convention `slug.locale.mdx`
 * @depends  none
 * @do       Add new locale detection strategies here
 * @dont     Import from CLI or UI; access filesystem
 */

const LOCALE_REGEX = /\.([a-z]{2}(?:-[A-Z]{2})?)\.mdx$/;

/**
 * Parses locale from a filename.
 * Supports `post.pt.mdx`, `post.en-US.mdx` patterns.
 * Returns undefined for files without a locale suffix.
 */
export function parseLocaleFromFilename(filename: string): string | undefined {
  const match = LOCALE_REGEX.exec(filename);
  return match?.[1];
}

/**
 * Removes the locale suffix from a slug.
 * Handles both pre-slugify (`.pt`) and post-slugify (`-pt`) formats,
 * since `@sindresorhus/slugify` converts dots to dashes.
 * `post.pt` → `post`, `post-pt` → `post`, `post` → `post`
 */
export function stripLocaleFromSlug(slug: string, locale?: string): string {
  if (!locale) return slug;
  const dotSuffix = `.${locale}`;
  if (slug.endsWith(dotSuffix)) return slug.slice(0, -dotSuffix.length);
  const dashSuffix = `-${locale}`;
  if (slug.endsWith(dashSuffix)) return slug.slice(0, -dashSuffix.length);
  return slug;
}
