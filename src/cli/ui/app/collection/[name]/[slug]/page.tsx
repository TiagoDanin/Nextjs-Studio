/**
 * @context  MDX entry page in the studio UI (cli/ui/app/collection/[name]/[slug]).
 * @does     Loads a single MDX entry's frontmatter and body, then renders the full MDX editor.
 *           Accepts an optional `?locale=` query param to open a specific locale variant.
 * @depends  actions/collections for getMdxEntry, editors/mdx-editor for the TipTap-based editor.
 * @do       Add entry-level metadata (word count, last saved) to this page.
 * @dont     Never render JSON editors here — this page is exclusively for MDX entries.
 */

import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MdxEditor } from "@/editors/mdx-editor/mdx-editor";
import { getCollections, getMdxEntry, getCollectionEntries, getComponentRegistry } from "@/actions/collections";

export const dynamic = "force-dynamic";

export default async function MdxEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string; slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { name, slug } = await params;
  const { locale } = await searchParams;

  const [collections, entry, collectionResult, registry] = await Promise.all([
    getCollections(),
    getMdxEntry(name, slug, locale),
    getCollectionEntries(name),
    getComponentRegistry(),
  ]);

  if (!entry) notFound();

  // Deduplicate sidebar entries by base slug — prefer the default locale entry,
  // falling back to the first available variant per slug.
  const allEntries = collectionResult?.entries ?? [];
  const sidebarEntries = (() => {
    const seen = new Map<string, typeof allEntries[0]>();
    for (const e of allEntries) {
      if (!seen.has(e.slug) || e.locale === undefined) seen.set(e.slug, e);
    }
    return Array.from(seen.values());
  })();

  const collectionsWithEntries = collections.map((collection) =>
    collection.name === name && collection.type === "mdx" && collectionResult
      ? {
          ...collection,
          sectionCount: sidebarEntries.length,
          entries: sidebarEntries.map((e) => ({
            slug: e.slug,
            title: String(e.data.title ?? e.slug),
          })),
        }
      : collection,
  );

  // Build the list of locale variants for this slug so the editor can show a locale switcher.
  const localeVariants = allEntries
    .filter((e) => e.slug === slug)
    .map((e) => ({ locale: e.locale ?? "default", slug: e.slug }));

  return (
    <>
      <AppSidebar
        collections={collectionsWithEntries}
        activeCollection={name}
        activeSlug={slug}
      />
      <main className="studio-main">
        <MdxEditor
          collectionName={name}
          slug={slug}
          filePath={entry.filePath}
          frontmatter={entry.frontmatter}
          body={entry.body}
          registry={registry}
          locales={localeVariants.length > 1 ? localeVariants : undefined}
          currentLocale={locale ?? "default"}
        />
      </main>
    </>
  );
}
