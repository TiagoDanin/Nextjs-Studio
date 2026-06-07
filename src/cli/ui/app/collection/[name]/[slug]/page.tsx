/**
 * @context  Single-entry edit page in the studio UI (cli/ui/app/collection/[name]/[slug]).
 * @does     Renders a dedicated edit screen for one entry: the MDX editor for MDX collections,
 *           or a single-row JSON form for json-array collections (reached via the row's edit button).
 *           Accepts an optional `?locale=` query param to open a specific MDX locale variant.
 * @depends  actions/collections, editors/mdx-editor, editors/json-form for the form editor.
 * @do       Add entry-level metadata (word count, last saved) to this page.
 * @dont     Render the sheet/table here — that lives on the collection index page.
 */

import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MdxEditor } from "@/editors/mdx-editor/mdx-editor";
import { JsonFormEditor } from "@/editors/json-form/json-form-editor";
import { getCollections, getMdxEntry, getCollectionEntries, getCollectionScripts, getComponentRegistry } from "@/actions/collections";

export const dynamic = "force-dynamic";

export default async function EntryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string; slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { name, slug: rawSlug } = await params;
  const { locale } = await searchParams;
  // json-array row slugs contain a "/" (e.g. "index/10"), encoded as %2F in the
  // URL. Next keeps the param encoded, so decode it back to match entry slugs.
  const slug = decodeURIComponent(rawSlug);

  const collections = await getCollections();
  const col = collections.find((c) => c.name === name);

  // json-array collections: edit a single row on its own form screen.
  if (col?.type === "json-array") {
    const [collectionResult, scripts] = await Promise.all([
      getCollectionEntries(name),
      getCollectionScripts(name),
    ]);
    const allEntries = collectionResult?.entries ?? [];
    const index = allEntries.findIndex((e) => e.slug === slug);
    if (!collectionResult || index === -1) notFound();

    return (
      <>
        <AppSidebar collections={collections} activeCollection={name} activeSlug={slug} />
        <main className="studio-main">
          <JsonFormEditor
            collection={collectionResult.collection}
            data={allEntries[index].data}
            filePath={collectionResult.filePath}
            hasSync={!!scripts.sync}
            arrayContext={{ allRows: allEntries.map((e) => e.data), index }}
          />
        </main>
      </>
    );
  }

  const [entry, collectionResult, registry] = await Promise.all([
    getMdxEntry(name, slug, locale),
    getCollectionEntries(name),
    getComponentRegistry(),
  ]);

  if (!entry) notFound();

  // Group entries by base slug and aggregate locale variants for sidebar chips.
  const allEntries = collectionResult?.entries ?? [];
  const sidebarEntries = (() => {
    const seen = new Map<string, { entry: typeof allEntries[0]; locales: Set<string> }>();
    for (const e of allEntries) {
      const existing = seen.get(e.slug);
      if (!existing) {
        seen.set(e.slug, { entry: e, locales: new Set([e.locale ?? "default"]) });
      } else {
        existing.locales.add(e.locale ?? "default");
        if (e.locale === undefined) existing.entry = e;
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      const da = String(a.entry.data.date ?? "");
      const db = String(b.entry.data.date ?? "");
      if (da === db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da); // newest first
    });
  })();

  const collectionsWithEntries = collections.map((collection) =>
    collection.name === name && collection.type === "mdx" && collectionResult
      ? {
          ...collection,
          sectionCount: sidebarEntries.length,
          entries: sidebarEntries.map(({ entry, locales }) => ({
            slug: entry.slug,
            title: String(entry.data.title ?? entry.slug),
            locales: locales.size > 1 ? Array.from(locales).sort() : undefined,
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
          fields={collectionResult?.collection.fields}
        />
      </main>
    </>
  );
}
